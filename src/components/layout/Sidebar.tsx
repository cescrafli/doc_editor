'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Trash2,
  Save,
  Loader2,
  Search,
  Paperclip,
  Download,
  ChevronDown,
  ChevronRight,
  Users,
  CloudUpload,
  CloudDownload,
  Plug,
} from 'lucide-react';
import type { AccessRole, DocumentDetail, DocumentSummary, User } from '@/types';
import type { UploadMode } from '@/components/modals/FileUploadModal';

export type FilterTab = 'all' | 'owned' | 'shared';

interface SidebarProps {
  isOpen: boolean;
  currentUser: User;
  documents: DocumentSummary[];
  filteredDocuments: DocumentSummary[];
  activeDoc: DocumentDetail | null;
  ownedCount: number;
  sharedCount: number;
  filterTab: FilterTab;
  searchQuery: string;
  loadingDocs: boolean;
  saveState: 'saved' | 'saving' | 'unsaved' | 'error';
  onFilterTabChange: (tab: FilterTab) => void;
  onSearchQueryChange: (query: string) => void;
  onSelectDocument: (docId: string) => void;
  onCreateDocument: () => void;
  onSaveSession: () => void;
  onDeleteDocument: () => void;
  onOpenUploadModal: (mode: UploadMode) => void;
  onOpenShareModal: () => void;
  onOpenUserSwitcher: () => void;
  onExportMarkdown: () => void;
  onExportStyledHtml: () => void;
  onPrintPdf: () => void;
}

function SidebarRoleBadge({ role }: { role: AccessRole }) {
  if (role === 'owner') {
    return (
      <span className="shrink-0 rounded bg-[#35D7BB]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#35D7BB]">
        Owner
      </span>
    );
  }
  if (role === 'editor') {
    return (
      <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
        Editor
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
      Viewer
    </span>
  );
}

export default function Sidebar({
  isOpen,
  currentUser,
  documents,
  filteredDocuments,
  activeDoc,
  ownedCount,
  sharedCount,
  filterTab,
  searchQuery,
  loadingDocs,
  saveState,
  onFilterTabChange,
  onSearchQueryChange,
  onSelectDocument,
  onCreateDocument,
  onSaveSession,
  onDeleteDocument,
  onOpenUploadModal,
  onOpenShareModal,
  onOpenUserSwitcher,
  onExportMarkdown,
  onExportStyledHtml,
  onPrintPdf,
}: SidebarProps) {
  const [openAccordions, setOpenAccordions] = useState({
    services: false,
    importFrom: false,
    saveTo: false,
    documents: true,
  });

  const toggleAccordion = (key: keyof typeof openAccordions) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside
      className={`no-print fixed sm:relative w-[270px] shrink-0 bg-[#2B2F36] h-dvh flex flex-col z-30 transition-all duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full sm:-ml-[270px]'
      }`}
    >
      <nav className="flex-1 overflow-y-auto px-4 pt-3">
        {/* SERVICES */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => toggleAccordion('services')}
            className="flex w-full items-center justify-between py-2 text-xs uppercase tracking-wider text-[#A0AABF] hover:text-white"
          >
            <span className="flex items-center gap-2.5">
              <Plug className="h-3.5 w-3.5 text-[#D3DAEA]" />
              <span>SERVICES</span>
            </span>
            {openAccordions.services ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {openAccordions.services && (
            <div className="mt-1 space-y-1 pl-1">
              <div className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-[#D0D6E2] hover:bg-[#1D212A]">
                <span>Turso Cloud SQLite</span>
                <span className="text-xs font-semibold text-[#35D7BB]">Connected</span>
              </div>
              <button
                type="button"
                onClick={() => activeDoc && onOpenShareModal()}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
              >
                <span>Role-Based Sharing</span>
                <span className="text-xs text-[#35D7BB]">Configure</span>
              </button>
              <button
                type="button"
                onClick={onOpenUserSwitcher}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
              >
                <span>Switch Account</span>
                <span className="text-xs text-[#35D7BB]">{currentUser.name.split(' ')[0]}</span>
              </button>
            </div>
          )}
        </div>

        {/* IMPORT FROM */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => toggleAccordion('importFrom')}
            className="flex w-full items-center justify-between py-2 text-xs uppercase tracking-wider text-[#A0AABF] hover:text-white"
          >
            <span className="flex items-center gap-2.5">
              <CloudUpload className="h-3.5 w-3.5 text-[#D3DAEA]" />
              <span>IMPORT FROM</span>
            </span>
            {openAccordions.importFrom ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {openAccordions.importFrom && (
            <div className="mt-1 space-y-1 pl-1">
              <button
                type="button"
                onClick={() => onOpenUploadModal('new-doc')}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
              >
                <Upload className="h-4 w-4 text-[#35D7BB]" />
                <span>File as New Document</span>
              </button>
              <button
                type="button"
                disabled={!activeDoc || activeDoc.accessRole === 'viewer'}
                onClick={() => onOpenUploadModal('import-into-current')}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white disabled:opacity-40"
              >
                <FileText className="h-4 w-4 text-[#35D7BB]" />
                <span>Import into Active Draft</span>
              </button>
              <button
                type="button"
                disabled={!activeDoc || activeDoc.accessRole === 'viewer'}
                onClick={() => onOpenUploadModal('attach-to-current')}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white disabled:opacity-40"
              >
                <Paperclip className="h-4 w-4 text-[#35D7BB]" />
                <span>Attach Reference File</span>
              </button>
            </div>
          )}
        </div>

        {/* SAVE TO */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => toggleAccordion('saveTo')}
            className="flex w-full items-center justify-between py-2 text-xs uppercase tracking-wider text-[#A0AABF] hover:text-white"
          >
            <span className="flex items-center gap-2.5">
              <CloudDownload className="h-3.5 w-3.5 text-[#D3DAEA]" />
              <span>SAVE TO</span>
            </span>
            {openAccordions.saveTo ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {openAccordions.saveTo && (
            <div className="mt-1 space-y-1 pl-1">
              <button
                type="button"
                onClick={onSaveSession}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
              >
                <Save className="h-4 w-4 text-[#35D7BB]" />
                <span>Turso Cloud Database</span>
              </button>
              <button
                type="button"
                onClick={onExportMarkdown}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
              >
                <Download className="h-4 w-4 text-[#35D7BB]" />
                <span>Markdown (.md)</span>
              </button>
              <button
                type="button"
                onClick={onExportStyledHtml}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
              >
                <Download className="h-4 w-4 text-[#35D7BB]" />
                <span>Styled HTML (.html)</span>
              </button>
              <button
                type="button"
                onClick={onPrintPdf}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
              >
                <Download className="h-4 w-4 text-[#35D7BB]" />
                <span>PDF Document</span>
              </button>
            </div>
          )}
        </div>

        {/* DOCUMENTS */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => toggleAccordion('documents')}
            className="flex w-full items-center justify-between py-2 text-xs uppercase tracking-wider text-[#A0AABF] hover:text-white"
          >
            <span className="flex items-center gap-2.5">
              <FileText className="h-3.5 w-3.5 text-[#D3DAEA]" />
              <span>DOCUMENTS ({documents.length})</span>
            </span>
            {openAccordions.documents ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {openAccordions.documents && (
            <div className="mt-1.5 space-y-2">
              <div className="grid grid-cols-3 gap-1 rounded bg-[#1D212A] p-1 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => onFilterTabChange('all')}
                  className={`rounded py-1 transition-colors ${
                    filterTab === 'all'
                      ? 'bg-[#373D49] text-[#35D7BB] font-semibold'
                      : 'text-[#A0AABF] hover:text-white'
                  }`}
                >
                  All ({documents.length})
                </button>
                <button
                  type="button"
                  onClick={() => onFilterTabChange('owned')}
                  className={`rounded py-1 transition-colors ${
                    filterTab === 'owned'
                      ? 'bg-[#373D49] text-[#35D7BB] font-semibold'
                      : 'text-[#A0AABF] hover:text-white'
                  }`}
                >
                  Owned ({ownedCount})
                </button>
                <button
                  type="button"
                  onClick={() => onFilterTabChange('shared')}
                  className={`rounded py-1 transition-colors ${
                    filterTab === 'shared'
                      ? 'bg-[#373D49] text-[#35D7BB] font-semibold'
                      : 'text-[#A0AABF] hover:text-white'
                  }`}
                >
                  Shared ({sharedCount})
                </button>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#A0AABF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="Filter documents…"
                  className="w-full rounded bg-[#1D212A] py-1.5 pl-8 pr-2.5 text-xs text-white placeholder:text-[#A0AABF]/70 focus:outline-none focus:ring-1 focus:ring-[#35D7BB]"
                />
              </div>

              {loadingDocs ? (
                <div className="flex items-center justify-center py-6 text-xs text-[#A0AABF]">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-[#35D7BB]" />
                  Loading…
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#A0AABF]">
                  No documents in this view.
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredDocuments.map((doc) => {
                    const isSelected = activeDoc?.id === doc.id;
                    return (
                      <li key={doc.id}>
                        <button
                          type="button"
                          onClick={() => onSelectDocument(doc.id)}
                          className={`w-full text-left px-3 py-2 rounded flex flex-col gap-1 transition-colors ${
                            isSelected
                              ? 'bg-[#1D212A] text-white'
                              : 'text-[#D0D6E2] hover:bg-[#1D212A]/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="flex items-center gap-2 truncate text-sm font-medium">
                              <FileText
                                className={`h-4 w-4 shrink-0 ${
                                  isSelected ? 'text-[#35D7BB]' : 'text-[#A0AABF]'
                                }`}
                              />
                              <span className="truncate">{doc.title}</span>
                            </span>
                            <SidebarRoleBadge role={doc.accessRole} />
                          </div>

                          <div className="flex items-center justify-between pl-6 text-[10px] text-[#A0AABF]">
                            <span className="truncate">
                              {doc.accessRole === 'owner'
                                ? 'Owned by you'
                                : `From: ${doc.ownerName}`}
                            </span>
                            {doc.shareCount > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Users className="h-2.5 w-2.5" />
                                {doc.shareCount}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar Bottom Actions */}
      <div className="p-4 space-y-2.5 border-t border-[#373D49]/60">
        <button
          type="button"
          onClick={onCreateDocument}
          className="w-full bg-[#35D7BB] text-[#2B2F36] py-2 px-4 rounded font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Document</span>
        </button>

        <button
          type="button"
          disabled={!activeDoc || activeDoc.accessRole === 'viewer' || saveState === 'saving'}
          onClick={onSaveSession}
          className="w-full bg-[#4A5261] text-white py-2 px-4 rounded font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          <span>{saveState === 'saving' ? 'Saving…' : 'Save Session'}</span>
        </button>

        <button
          type="button"
          disabled={!activeDoc || activeDoc.accessRole !== 'owner'}
          onClick={onDeleteDocument}
          title={
            activeDoc?.accessRole === 'owner'
              ? 'Delete this document'
              : 'Only the document owner can delete this document'
          }
          className="w-full bg-[#DC2626] text-white py-2 px-4 rounded font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Document</span>
        </button>
      </div>
    </aside>
  );
}
