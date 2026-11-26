import { marked } from 'marked';
import mammoth from 'mammoth';
import type { ParsedFileResult } from '@/types';

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const SUPPORTED_IMPORT_EXTENSIONS = ['.txt', '.md', '.markdown', '.docx', '.html', '.htm'];
export const SUPPORTED_ATTACHMENT_EXTENSIONS = [
  '.txt',
  '.md',
  '.markdown',
  '.docx',
  '.html',
  '.htm',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.csv',
  '.json',
];

export class FileValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'FileValidationError';
    this.status = status;
  }
}

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  if (idx === -1) return '';
  return fileName.slice(idx).toLowerCase();
}

export function deriveTitleFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt.replace(/[-_]+/g, ' ').trim();
  return cleaned || 'Imported Document';
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return '<p></p>';
  }
  const paragraphs = normalized.split(/\n{2,}/);
  return paragraphs
    .map((para) => {
      const lines = para
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br />');
      return `<p>${lines}</p>`;
    })
    .join('');
}

export function sanitizeImportedHtml(rawHtml: string): string {
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    cleaned = bodyMatch[1];
  }
  return cleaned.trim() || '<p></p>';
}

export async function parseFileToHtml(
  fileName: string,
  fileSize: number,
  buffer: Buffer
): Promise<ParsedFileResult> {
  if (!fileName || !fileName.trim()) {
    throw new FileValidationError('File name is required.');
  }

  if (fileSize <= 0 || buffer.length === 0) {
    throw new FileValidationError('Uploaded file is empty.');
  }

  if (fileSize > MAX_FILE_SIZE_BYTES || buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new FileValidationError(
      `File exceeds maximum size limit of 2 MB (uploaded ${(fileSize / (1024 * 1024)).toFixed(2)} MB).`
    );
  }

  const ext = getFileExtension(fileName);
  if (!SUPPORTED_IMPORT_EXTENSIONS.includes(ext)) {
    throw new FileValidationError(
      `Unsupported file format "${ext || 'unknown'}". Supported import formats: ${SUPPORTED_IMPORT_EXTENSIONS.join(', ')}.`
    );
  }

  let htmlContent = '<p></p>';

  if (ext === '.txt') {
    htmlContent = plainTextToHtml(buffer.toString('utf-8'));
  } else if (ext === '.md' || ext === '.markdown') {
    const rendered = await marked.parse(buffer.toString('utf-8'), { async: true });
    htmlContent = sanitizeImportedHtml(rendered);
  } else if (ext === '.html' || ext === '.htm') {
    htmlContent = sanitizeImportedHtml(buffer.toString('utf-8'));
  } else if (ext === '.docx') {
    try {
      const result = await mammoth.convertToHtml({ buffer });
      htmlContent = sanitizeImportedHtml(result.value || '<p></p>');
    } catch {
      throw new FileValidationError(
        'Could not parse .docx file. Please verify the file is a valid Word (.docx) document.'
      );
    }
  }

  return {
    fileName,
    fileType: ext.replace('.', '').toUpperCase(),
    fileSize,
    suggestedTitle: deriveTitleFromFileName(fileName),
    htmlContent,
  };
}

export async function validateAndExtractAttachment(
  fileName: string,
  fileSize: number,
  buffer: Buffer
): Promise<{
  ext: string;
  extractedHtml: string | null;
}> {
  if (!fileName || !fileName.trim()) {
    throw new FileValidationError('File name is required.');
  }
  if (fileSize <= 0 || buffer.length === 0) {
    throw new FileValidationError('Uploaded file is empty.');
  }
  if (fileSize > MAX_FILE_SIZE_BYTES || buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new FileValidationError('Attachment exceeds the 2 MB maximum size limit.');
  }

  const ext = getFileExtension(fileName);
  if (!SUPPORTED_ATTACHMENT_EXTENSIONS.includes(ext)) {
    throw new FileValidationError(
      `Unsupported attachment type "${ext || 'unknown'}". Supported types: ${SUPPORTED_ATTACHMENT_EXTENSIONS.join(', ')}.`
    );
  }

  let extractedHtml: string | null = null;
  if (SUPPORTED_IMPORT_EXTENSIONS.includes(ext)) {
    try {
      const parsed = await parseFileToHtml(fileName, fileSize, buffer);
      extractedHtml = parsed.htmlContent;
    } catch {
      extractedHtml = null;
    }
  }

  return { ext: ext.replace('.', '').toUpperCase(), extractedHtml };
}
