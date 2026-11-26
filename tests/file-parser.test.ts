import { describe, it, expect } from 'vitest';
import {
  FileValidationError,
  MAX_FILE_SIZE_BYTES,
  parseFileToHtml,
  sanitizeImportedHtml,
} from '@/lib/utils/file-parser';
import {
  buildExportFileName,
  buildStyledHtmlDocument,
  htmlToMarkdown,
} from '@/lib/utils/exporters';

describe('File Parser & Export Utilities', () => {
  it('parses Markdown (.md) and Plain Text (.txt) uploads into sanitized rich-text HTML', async () => {
    const mdContent = '# Product Spec\n\nHere is **bold** and *italic* text.\n\n- Item A\n- Item B';
    const mdBuffer = Buffer.from(mdContent, 'utf-8');

    const parsedMd = await parseFileToHtml('product-spec_v1.md', mdBuffer.length, mdBuffer);
    expect(parsedMd.suggestedTitle).toBe('product spec v1');
    expect(parsedMd.htmlContent).toContain('<h1>Product Spec</h1>');
    expect(parsedMd.htmlContent).toContain('<strong>bold</strong>');
    expect(parsedMd.htmlContent).toContain('<li>Item A</li>');

    const txtContent = 'First paragraph\nwith line break\n\nSecond paragraph <script>alert(1)</script>';
    const txtBuffer = Buffer.from(txtContent, 'utf-8');
    const parsedTxt = await parseFileToHtml('meeting-notes.txt', txtBuffer.length, txtBuffer);
    expect(parsedTxt.htmlContent).toContain('<p>First paragraph<br />with line break</p>');
    expect(parsedTxt.htmlContent).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('strips dangerous scripts and inline handlers from imported HTML', () => {
    const dirty = '<html><body><h1 onclick="evil()">Title</h1><script>alert(1)</script><p>Safe</p></body></html>';
    const clean = sanitizeImportedHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('<h1>Title</h1>');
    expect(clean).toContain('<p>Safe</p>');
  });

  it('rejects unsupported file extensions and oversized uploads', async () => {
    const dummy = Buffer.from('binary-content', 'utf-8');
    await expect(parseFileToHtml('malware.exe', dummy.length, dummy)).rejects.toThrow(
      FileValidationError
    );

    await expect(
      parseFileToHtml('huge.txt', MAX_FILE_SIZE_BYTES + 100, dummy)
    ).rejects.toThrow(/exceeds maximum size limit/i);
  });

  it('converts editor HTML to Markdown and generates clean export filenames', () => {
    const md = htmlToMarkdown('<h1>Hello</h1><p><strong>Bold</strong> &amp; <em>italic</em></p>');
    expect(md).toContain('# Hello');
    expect(md).toContain('**Bold** & *italic*');

    expect(buildExportFileName('Welcome to Cesctor.md', 'md')).toBe('welcome-to-cesctor.md');
    expect(buildExportFileName('Q4 Roadmap!', 'html')).toBe('q4-roadmap.html');

    const styled = buildStyledHtmlDocument('My Doc', '<p>Body</p>');
    expect(styled).toContain('<!DOCTYPE html>');
    expect(styled).toContain('<title>My Doc</title>');
    expect(styled).toContain('<p>Body</p>');
  });
});
