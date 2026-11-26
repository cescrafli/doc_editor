'use client';

import React from 'react';
import { Paperclip, Plus, X, ArrowDownToLine, Download, Trash2 } from 'lucide-react';
import type { DocumentDetail, User } from '@/types';

interface AttachmentsBarProps {
  activeDoc: DocumentDetail;
  currentUser: User;
  onOpenAttachModal: () => void;
  onInsertExtractedHtml: (extractedHtml: string, fileName: string) => Promise<void>;
  onDeleteAttachment: (attachmentId: string, fileName: string) => Promise<void>;
  onClose: () => void;
}

export default function AttachmentsBar({
  activeDoc,
  currentUser,
  onOpenAttachModal,
  onInsertExtractedHtml,
  onDeleteAttachment,
  onClose,
}: AttachmentsBarProps) {
  const canEdit = activeDoc.accessRole !== 'viewer';

  return (
    <div className="no-print border-b border-[#E8E8E8] bg-[#FAFBFC] px-4 py-3 shrink-0">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-[#35D7BB]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#373D49]">
            Document Attachments ({activeDoc.attachments.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={onOpenAttachModal}
              className="inline-flex items-center gap-1 rounded bg-[#35D7BB] px-2.5 py-1 text-xs font-semibold text-[#2B2F36] hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Attachment</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-[#A0AABF] hover:text-[#373D49]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeDoc.attachments.length === 0 ? (
        <p className="text-xs text-[#A0AABF] py-1">
          No reference files attached to this document yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {activeDoc.attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs shadow-2xs"
            >
              <span className="rounded bg-[#2B2F36] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#35D7BB]">
                {att.fileType}
              </span>
              <span className="font-medium text-[#373D49]">{att.fileName}</span>
              <span className="text-[10px] text-[#A0AABF]">
                ({(att.fileSize / 1024).toFixed(1)} KB)
              </span>

              {att.extractedHtml && canEdit && (
                <button
                  type="button"
                  onClick={() => onInsertExtractedHtml(att.extractedHtml!, att.fileName)}
                  className="inline-flex items-center gap-1 rounded bg-[#35D7BB]/20 px-2 py-0.5 text-[11px] font-semibold text-[#2B2F36] hover:bg-[#35D7BB]/30"
                >
                  <ArrowDownToLine className="h-3 w-3" />
                  <span>Insert</span>
                </button>
              )}

              <a
                href={`/api/documents/${activeDoc.id}/attachments/${att.id}?actingUserId=${encodeURIComponent(
                  currentUser.id
                )}`}
                download={att.fileName}
                className="text-[#373D49] hover:text-[#35D7BB]"
                title="Download attachment"
              >
                <Download className="h-3.5 w-3.5" />
              </a>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => onDeleteAttachment(att.id, att.fileName)}
                  className="text-[#A0AABF] hover:text-red-600"
                  title="Delete attachment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
