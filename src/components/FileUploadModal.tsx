'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  FilePlus2,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  SUPPORTED_ATTACHMENT_EXTENSIONS,
  SUPPORTED_IMPORT_EXTENSIONS,
} from '@/lib/file-parser';

export type UploadMode = 'new-doc' | 'import-into-current' | 'attach-to-current';

interface FileUploadModalProps {
  initialMode: UploadMode;
  hasActiveEditableDoc: boolean;
  activeDocTitle?: string;
  onClose: () => void;
  onCreateNewDocFromFile: (file: File) => Promise<void>;
  onImportIntoCurrentDoc: (file: File, mode: 'append' | 'replace') => Promise<void>;
  onAttachFileToCurrentDoc: (file: File) => Promise<void>;
}

export default function FileUploadModal({
  initialMode,
  hasActiveEditableDoc,
  activeDocTitle,
  onClose,
  onCreateNewDocFromFile,
  onImportIntoCurrentDoc,
  onAttachFileToCurrentDoc,
}: FileUploadModalProps) {
  const [mode, setMode] = useState<UploadMode>(
    hasActiveEditableDoc ? initialMode : 'new-doc'
  );
  const [importBehavior, setImportBehavior] = useState<'append' | 'replace'>('append');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedExtensions =
    mode === 'attach-to-current'
      ? SUPPORTED_ATTACHMENT_EXTENSIONS
      : SUPPORTED_IMPORT_EXTENSIONS;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'new-doc') {
        await onCreateNewDocFromFile(selectedFile);
      } else if (mode === 'import-into-current') {
        await onImportIntoCurrentDoc(selectedFile, importBehavior);
      } else {
        await onAttachFileToCurrentDoc(selectedFile);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                File Upload &amp; Document Import
              </h3>
              <p className="text-xs text-slate-500">
                Convert uploaded files into editable rich text or attach reference files
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Workflow Mode Selector */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                setMode('new-doc');
                setError(null);
              }}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                mode === 'new-doc'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FilePlus2
                className={`mb-1.5 h-4 w-4 ${
                  mode === 'new-doc' ? 'text-indigo-600' : 'text-slate-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-900">
                New Document
              </span>
              <span className="text-[11px] text-slate-500">
                Turn file into a new editable doc
              </span>
            </button>

            <button
              type="button"
              disabled={!hasActiveEditableDoc}
              onClick={() => {
                setMode('import-into-current');
                setError(null);
              }}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === 'import-into-current'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileText
                className={`mb-1.5 h-4 w-4 ${
                  mode === 'import-into-current'
                    ? 'text-indigo-600'
                    : 'text-slate-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-900">
                Import into Draft
              </span>
              <span className="text-[11px] text-slate-500">
                Insert content into current doc
              </span>
            </button>

            <button
              type="button"
              disabled={!hasActiveEditableDoc}
              onClick={() => {
                setMode('attach-to-current');
                setError(null);
              }}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === 'attach-to-current'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Paperclip
                className={`mb-1.5 h-4 w-4 ${
                  mode === 'attach-to-current'
                    ? 'text-indigo-600'
                    : 'text-slate-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-900">
                Attach File
              </span>
              <span className="text-[11px] text-slate-500">
                Associate attachment with doc
              </span>
            </button>
          </div>

          {/* Target document info */}
          {mode !== 'new-doc' && activeDocTitle && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
              Target document: <strong className="text-slate-900">{activeDocTitle}</strong>
            </div>
          )}

          {/* Append vs Replace option when importing into current draft */}
          {mode === 'import-into-current' && (
            <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-slate-700">Import behavior:</span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                <input
                  type="radio"
                  name="importBehavior"
                  checked={importBehavior === 'append'}
                  onChange={() => setImportBehavior('append')}
                  className="text-indigo-600"
                />
                <span>Append to existing content</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                <input
                  type="radio"
                  name="importBehavior"
                  checked={importBehavior === 'replace'}
                  onChange={() => setImportBehavior('replace')}
                  className="text-indigo-600"
                />
                <span>Replace document content</span>
              </label>
            </div>
          )}

          {/* File Dropzone / Input */}
          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-7 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/30">
              <Upload className="mb-2 h-7 w-7 text-indigo-500" />
              <span className="text-sm font-medium text-slate-800">
                {selectedFile ? selectedFile.name : 'Click to select a file from your computer'}
              </span>
              {selectedFile ? (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {(selectedFile.size / 1024).toFixed(1)} KB ready to process
                </span>
              ) : (
                <span className="mt-1 text-xs text-slate-500">
                  Maximum file size: <strong>2 MB</strong>
                </span>
              )}
              <input
                type="file"
                accept={allowedExtensions.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Explicit Supported File Types Notice */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">
              Supported File Formats (Max 2 MB):
            </div>
            {mode === 'attach-to-current' ? (
              <p>
                Attachments support:{' '}
                <code className="rounded bg-white px-1 py-0.5 text-[11px] font-mono text-indigo-700">
                  {SUPPORTED_ATTACHMENT_EXTENSIONS.join(', ')}
                </code>
                . Text/Markdown/Word attachments also include a 1-click{' '}
                <em>&ldquo;Insert into Editor&rdquo;</em> action.
              </p>
            ) : (
              <p>
                Rich-text conversion supports:{' '}
                <code className="rounded bg-white px-1 py-0.5 text-[11px] font-mono text-indigo-700">
                  .md, .markdown, .txt, .docx, .html
                </code>
                . Formatting (headings, bold, italics, lists) is automatically preserved.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {mode === 'new-doc'
                  ? 'Upload & Open as Document'
                  : mode === 'import-into-current'
                  ? 'Import Content into Editor'
                  : 'Upload Attachment'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
