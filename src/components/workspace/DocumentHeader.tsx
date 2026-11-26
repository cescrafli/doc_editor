'use client';

import React, { useState } from 'react';
import { Crown, Edit3, Eye, Pen, Upload } from 'lucide-react';
import type { AccessRole, DocumentDetail } from '@/types';

interface DocumentHeaderProps {
  activeDoc: DocumentDetail;
  draftTitle: string;
  saveState: 'saved' | 'saving' | 'unsaved' | 'error';
  nightMode: boolean;
  onChangeTitle: (nextTitle: string) => void;
  onCommitTitle: (finalTitle: string) => void;
  onOpenImportIntoDraft: () => void;
}

function HeaderRoleBadge({ role }: { role: AccessRole }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-[#2B2F36] px-2 py-0.5 text-[11px] font-semibold text-[#35D7BB]">
        <Crown className="h-3 w-3" />
        Owner
      </span>
    );
  }
  if (role === 'editor') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
        <Edit3 className="h-3 w-3" />
        Shared • Editor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
      <Eye className="h-3 w-3" />
      Shared • Viewer
    </span>
  );
}

export default function DocumentHeader({
  activeDoc,
  draftTitle,
  saveState,
  nightMode,
  onChangeTitle,
  onCommitTitle,
  onOpenImportIntoDraft,
}: DocumentHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const canEdit = activeDoc.accessRole !== 'viewer';

  return (
    <div
      className={`no-print h-14 flex items-center justify-between px-4 border-b shrink-0 ${
        nightMode
          ? 'bg-[#2B2F36] border-[#373D49] text-white'
          : 'bg-white border-[#E8E8E8] text-[#373D49]'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditingTitle && canEdit ? (
          <input
            type="text"
            value={draftTitle}
            autoFocus
            onChange={(e) => onChangeTitle(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false);
              onCommitTitle(draftTitle);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingTitle(false);
                onCommitTitle(draftTitle);
              } else if (e.key === 'Escape') {
                onChangeTitle(activeDoc.title);
                setIsEditingTitle(false);
              }
            }}
            className="max-w-md rounded border border-[#35D7BB] bg-transparent px-2 py-1 text-base font-semibold focus:outline-none"
          />
        ) : (
          <h2
            onClick={() => canEdit && setIsEditingTitle(true)}
            className={`font-semibold text-base truncate ${
              canEdit ? 'cursor-pointer hover:text-[#35D7BB]' : ''
            }`}
            title={canEdit ? 'Click to rename document' : 'View-only document'}
          >
            {draftTitle}
          </h2>
        )}

        <span className="text-xs text-[#A0AABF] ml-2 opacity-75 shrink-0">
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'unsaved'
            ? 'Unsaved'
            : saveState === 'error'
            ? 'Error saving'
            : 'Saved'}
        </span>

        {canEdit && !isEditingTitle && (
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            title="Edit title"
            className="text-[#A0AABF] hover:text-[#35D7BB] p-1 transition-colors"
          >
            <Pen className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 text-xs shrink-0">
        <HeaderRoleBadge role={activeDoc.accessRole} />
        <span className="hidden md:inline text-[#A0AABF]">
          Owner:{' '}
          <strong className={nightMode ? 'text-white' : 'text-[#373D49]'}>
            {activeDoc.ownerName}
          </strong>
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={onOpenImportIntoDraft}
            className="hidden sm:inline-flex items-center gap-1 rounded border border-[#E8E8E8] px-2.5 py-1 text-xs font-medium text-[#373D49] hover:border-[#35D7BB] hover:text-[#2B2F36] bg-white"
          >
            <Upload className="h-3 w-3 text-[#35D7BB]" />
            <span>Import into Draft</span>
          </button>
        )}
      </div>
    </div>
  );
}
