'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export default function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#4F535B] bg-[#2B2F36] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#4F535B] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#35D7BB]">
            Cesctor Shortcuts &amp; Permissions Guide
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A0AABF] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-xs text-[#D0D6E2]">
          <p>
            <strong className="text-white">Formatting Shortcuts:</strong>{' '}
            <code>Ctrl+B</code> (Bold), <code>Ctrl+I</code> (Italic),{' '}
            <code>Ctrl+U</code> (Underline), <code>Ctrl+Z</code> (Undo).
          </p>
          <p>
            <strong className="text-white">File Import Formats (Max 2 MB):</strong>{' '}
            <code>.md</code>, <code>.txt</code>, <code>.docx</code>, <code>.html</code>.
          </p>
          <p>
            <strong className="text-white">Role-Based Access Control:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-[#35D7BB]">Owner:</strong> Full edit, rename, share, upload
              attachments, and delete document.
            </li>
            <li>
              <strong className="text-emerald-300">Editor:</strong> Edit content, rename, and
              import/upload files.
            </li>
            <li>
              <strong className="text-amber-300">Viewer:</strong> Read-only access (editor is
              locked and write APIs return 403).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
