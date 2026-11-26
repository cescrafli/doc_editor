'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Sidebar, { type FilterTab } from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import StatusFooter from '@/components/layout/StatusFooter';
import DocumentHeader from '@/components/workspace/DocumentHeader';
import AttachmentsBar from '@/components/workspace/AttachmentsBar';
import RichTextEditor from '@/components/editor/RichTextEditor';
import ShareModal from '@/components/modals/ShareModal';
import FileUploadModal, { type UploadMode } from '@/components/modals/FileUploadModal';
import SettingsDrawer from '@/components/modals/SettingsDrawer';
import ShortcutsModal from '@/components/modals/ShortcutsModal';
import {
  buildExportFileName,
  buildStyledHtmlDocument,
  htmlToMarkdown,
  triggerBrowserDownload,
} from '@/lib/utils/exporters';
import type { DocumentDetail, DocumentSummary, ShareRole, User } from '@/types';

const ACTIVE_USER_STORAGE_KEY = 'cesctor_active_user_id';
const LEGACY_USER_STORAGE_KEY = 'ajaia_active_user_id';

const DEFAULT_NEW_DOC_CONTENT =
  '<h1>Welcome to Cesctor</h1><p>A clean, distraction-free collaborative document editor. Type on the left, see the rendered output on the right.</p><h2>Text Formatting</h2><p>Cesctor makes it easy to format text. You can write in <strong>bold</strong>, <em>italic</em>, <u>underline</u>, or <s>strikethrough</s>. Use <code>inline code</code> for technical terms.</p><h2>Lists</h2><ul><li>Import files from local Markdown (.md), Plain Text (.txt), Word (.docx), or HTML</li><li>Share documents with teammates as <strong>Editor</strong> or <strong>Viewer</strong></li><li>Export to Markdown, HTML, or PDF</li></ul>';

export default function WorkspaceApp() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('user-rafli');
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentDetail | null>(null);

  // Layout & preferences state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showWordCount, setShowWordCount] = useState(true);
  const [showCharCount, setShowCharCount] = useState(true);

  // Editor draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

  // Modals & drawers
  const [showShareModal, setShowShareModal] = useState(false);
  const [uploadModalMode, setUploadModalMode] = useState<UploadMode | null>(null);
  const [showAttachmentsDrawer, setShowAttachmentsDrawer] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingActiveDoc, setLoadingActiveDoc] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'info' | 'error' | 'success';
    text: string;
  } | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = useMemo<User>(
    () =>
      users.find((u) => u.id === currentUserId) || {
        id: 'user-rafli',
        name: 'Rafli Prasetyo',
        email: 'raflimudji@gmail.com',
        avatarColor: '#35D7BB',
        roleTitle: 'AI-Native Full Stack Engineer',
      },
    [users, currentUserId]
  );

  const apiFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {});
      headers.set('x-user-id', currentUserId);
      const res = await fetch(url, { ...init, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data;
    },
    [currentUserId]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser =
        localStorage.getItem(ACTIVE_USER_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_USER_STORAGE_KEY);
      if (savedUser) {
        setCurrentUserId(savedUser);
      }
    }
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setUsers(d.users);
      })
      .catch(console.error);
  }, []);

  const loadDocumentDetail = useCallback(
    async (docId: string) => {
      setLoadingActiveDoc(true);
      try {
        const data = await apiFetch(`/api/documents/${docId}`);
        const doc: DocumentDetail = data.document;
        setActiveDoc(doc);
        setDraftTitle(doc.title);
        setDraftContent(doc.content);
        setIsDirty(false);
        setSaveState('saved');
      } catch (err) {
        setBannerMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Could not open document.',
        });
        setActiveDoc(null);
      } finally {
        setLoadingActiveDoc(false);
      }
    },
    [apiFetch]
  );

  const loadDocumentsList = useCallback(
    async (selectFirstIfNone = false, preferredDocId?: string) => {
      setLoadingDocs(true);
      try {
        const data = await apiFetch('/api/documents');
        const list: DocumentSummary[] = data.documents || [];
        setDocuments(list);

        if (preferredDocId) {
          const found = list.find((d) => d.id === preferredDocId);
          if (found) {
            await loadDocumentDetail(found.id);
            return;
          }
        }

        if (selectFirstIfNone) {
          if (list.length > 0) {
            await loadDocumentDetail(list[0].id);
          } else {
            setActiveDoc(null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDocs(false);
      }
    },
    [apiFetch, loadDocumentDetail]
  );

  useEffect(() => {
    loadDocumentsList(true, activeDoc?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const handleSaveDocument = useCallback(
    async (titleToSave?: string, contentToSave?: string) => {
      if (!activeDoc || activeDoc.accessRole === 'viewer') return;
      const finalTitle = (titleToSave ?? draftTitle).trim() || 'Untitled Document.md';
      const finalContent = contentToSave ?? draftContent;

      setSaveState('saving');
      try {
        const data = await apiFetch(`/api/documents/${activeDoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: finalTitle, content: finalContent }),
        });
        const updated: DocumentDetail = data.document;
        setActiveDoc(updated);
        setDraftTitle(updated.title);
        setIsDirty(false);
        setSaveState('saved');

        const listData = await apiFetch('/api/documents');
        if (listData.documents) {
          setDocuments(listData.documents);
        }
      } catch (err) {
        setSaveState('error');
        setBannerMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Failed to save changes.',
        });
      }
    },
    [activeDoc, apiFetch, draftContent, draftTitle]
  );

  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !activeDoc || activeDoc.accessRole === 'viewer') return;
    setSaveState('unsaved');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveDocument(draftTitle, draftContent);
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [draftTitle, draftContent, isDirty, activeDoc, autoSaveEnabled, handleSaveDocument]);

  const handleCreateBlankDocument = async () => {
    try {
      const data = await apiFetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Document.md',
          content: DEFAULT_NEW_DOC_CONTENT,
        }),
      });
      await loadDocumentsList(false, data.document.id);
      setBannerMessage({ type: 'success', text: 'Created new Cesctor document.' });
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create document.',
      });
    }
  };

  const handleDeleteCurrentDocument = async () => {
    if (!activeDoc || activeDoc.accessRole !== 'owner') return;
    const confirmed = window.confirm(
      `Delete "${activeDoc.title}" permanently? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/api/documents/${activeDoc.id}`, { method: 'DELETE' });
      setBannerMessage({ type: 'info', text: `Deleted "${activeDoc.title}".` });
      setActiveDoc(null);
      await loadDocumentsList(true);
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete document.',
      });
    }
  };

  const handleShareDocument = async (email: string, role: ShareRole) => {
    if (!activeDoc) return;
    const data = await apiFetch(`/api/documents/${activeDoc.id}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    setActiveDoc(data.document);
    const uRes = await fetch('/api/users').then((r) => r.json());
    if (uRes.users) setUsers(uRes.users);
    await loadDocumentsList(false, activeDoc.id);
  };

  const handleRevokeShare = async (targetUserId: string) => {
    if (!activeDoc) return;
    const data = await apiFetch(
      `/api/documents/${activeDoc.id}/shares?userId=${encodeURIComponent(targetUserId)}`,
      { method: 'DELETE' }
    );
    setActiveDoc(data.document);
    await loadDocumentsList(false, activeDoc.id);
  };

  const handleCreateNewDocFromFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('createDocument', 'true');

    const data = await apiFetch('/api/upload/parse', { method: 'POST', body: formData });
    await loadDocumentsList(false, data.document.id);
    setBannerMessage({
      type: 'success',
      text: `Imported "${file.name}" as a new editable document!`,
    });
  };

  const handleImportIntoCurrentDoc = async (file: File, behavior: 'append' | 'replace') => {
    if (!activeDoc) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('createDocument', 'false');

    const data = await apiFetch('/api/upload/parse', { method: 'POST', body: formData });
    const nextContent =
      behavior === 'replace'
        ? data.parsed.htmlContent
        : `${draftContent}<hr />${data.parsed.htmlContent}`;

    setDraftContent(nextContent);
    await handleSaveDocument(draftTitle, nextContent);
    setBannerMessage({
      type: 'success',
      text: `Imported content from "${file.name}" into "${activeDoc.title}".`,
    });
  };

  const handleAttachFileToCurrentDoc = async (file: File) => {
    if (!activeDoc) return;
    const formData = new FormData();
    formData.append('file', file);

    const data = await apiFetch(`/api/documents/${activeDoc.id}/attachments`, {
      method: 'POST',
      body: formData,
    });
    setActiveDoc(data.document);
    setShowAttachmentsDrawer(true);
    await loadDocumentsList(false, activeDoc.id);
    setBannerMessage({
      type: 'success',
      text: `Attached "${file.name}" to "${activeDoc.title}".`,
    });
  };

  const handleDeleteAttachment = async (attachmentId: string, fileName: string) => {
    if (!activeDoc) return;
    try {
      const data = await apiFetch(
        `/api/documents/${activeDoc.id}/attachments?attachmentId=${encodeURIComponent(attachmentId)}`,
        { method: 'DELETE' }
      );
      setActiveDoc(data.document);
      await loadDocumentsList(false, activeDoc.id);
      setBannerMessage({ type: 'info', text: `Removed attachment "${fileName}".` });
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to remove attachment.',
      });
    }
  };

  const handleSwitchUser = (userId: string) => {
    setCurrentUserId(userId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
    }
    setShowUserDropdown(false);
    const target = users.find((u) => u.id === userId);
    if (target) {
      setBannerMessage({
        type: 'info',
        text: `Switched active account to ${target.name} (${target.email}).`,
      });
    }
  };

  const handleCreateCustomUser = async (email: string, name?: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');
      const uRes = await fetch('/api/users').then((r) => r.json());
      if (uRes.users) setUsers(uRes.users);
      handleSwitchUser(data.user.id);
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid email address.',
      });
    }
  };

  const handleExportMarkdown = () => {
    if (!activeDoc) return;
    triggerBrowserDownload(
      htmlToMarkdown(draftContent),
      buildExportFileName(draftTitle, 'md'),
      'text/markdown;charset=utf-8'
    );
  };

  const handleExportHtml = (styled: boolean) => {
    if (!activeDoc) return;
    const payload = styled ? buildStyledHtmlDocument(draftTitle, draftContent) : draftContent;
    triggerBrowserDownload(
      payload,
      buildExportFileName(draftTitle, 'html'),
      'text/html;charset=utf-8'
    );
  };

  const ownedCount = documents.filter((d) => d.accessRole === 'owner').length;
  const sharedCount = documents.filter((d) => d.accessRole !== 'owner').length;

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) => {
        if (filterTab === 'owned' && doc.accessRole !== 'owner') return false;
        if (filterTab === 'shared' && doc.accessRole === 'owner') return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            doc.title.toLowerCase().includes(q) ||
            doc.excerpt.toLowerCase().includes(q) ||
            doc.ownerName.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [documents, filterTab, searchQuery]
  );

  return (
    <div className="flex h-dvh overflow-hidden relative bg-white">
      {!zenMode && (
        <Sidebar
          isOpen={sidebarOpen}
          currentUser={currentUser}
          documents={documents}
          filteredDocuments={filteredDocuments}
          activeDoc={activeDoc}
          ownedCount={ownedCount}
          sharedCount={sharedCount}
          filterTab={filterTab}
          searchQuery={searchQuery}
          loadingDocs={loadingDocs}
          saveState={saveState}
          onFilterTabChange={setFilterTab}
          onSearchQueryChange={setSearchQuery}
          onSelectDocument={loadDocumentDetail}
          onCreateDocument={handleCreateBlankDocument}
          onSaveSession={() => handleSaveDocument(draftTitle, draftContent)}
          onDeleteDocument={handleDeleteCurrentDocument}
          onOpenUploadModal={setUploadModalMode}
          onOpenShareModal={() => setShowShareModal(true)}
          onOpenUserSwitcher={() => setShowUserDropdown(true)}
          onExportMarkdown={handleExportMarkdown}
          onExportStyledHtml={() => handleExportHtml(true)}
          onPrintPdf={() => window.print()}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 h-dvh">
        <Navbar
          activeDoc={activeDoc}
          users={users}
          currentUser={currentUser}
          showAttachmentsDrawer={showAttachmentsDrawer}
          showPreview={showPreview}
          zenMode={zenMode}
          showSettingsDrawer={showSettingsDrawer}
          showUserDropdown={showUserDropdown}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onOpenImport={() => setUploadModalMode('new-doc')}
          onToggleAttachments={() => setShowAttachmentsDrawer((v) => !v)}
          onOpenShare={() => setShowShareModal(true)}
          onExportMarkdown={handleExportMarkdown}
          onExportHtml={handleExportHtml}
          onPrintPdf={() => window.print()}
          onTogglePreview={() => setShowPreview((v) => !v)}
          onToggleZenMode={() => setZenMode((v) => !v)}
          onToggleSettings={() => setShowSettingsDrawer((v) => !v)}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onSetUserDropdown={setShowUserDropdown}
          onSwitchUser={handleSwitchUser}
          onCreateCustomUser={handleCreateCustomUser}
        />

        {bannerMessage && (
          <div
            className={`no-print flex items-center justify-between border-b px-4 py-1.5 text-xs font-medium shrink-0 ${
              bannerMessage.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : bannerMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-[#35D7BB]/40 bg-[#2B2F36] text-[#35D7BB]'
            }`}
          >
            <span>{bannerMessage.text}</span>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="ml-4 text-xs underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeDoc && (
          <DocumentHeader
            activeDoc={activeDoc}
            draftTitle={draftTitle}
            saveState={saveState}
            nightMode={nightMode}
            onChangeTitle={(nextTitle) => {
              setDraftTitle(nextTitle);
              setIsDirty(true);
            }}
            onCommitTitle={(finalTitle) => handleSaveDocument(finalTitle, draftContent)}
            onOpenImportIntoDraft={() => setUploadModalMode('import-into-current')}
          />
        )}

        {showAttachmentsDrawer && activeDoc && (
          <AttachmentsBar
            activeDoc={activeDoc}
            currentUser={currentUser}
            onOpenAttachModal={() => setUploadModalMode('attach-to-current')}
            onInsertExtractedHtml={async (extractedHtml, fileName) => {
              const next = `${draftContent}<hr />${extractedHtml}`;
              setDraftContent(next);
              await handleSaveDocument(draftTitle, next);
              setBannerMessage({
                type: 'success',
                text: `Inserted content from "${fileName}" into editor.`,
              });
            }}
            onDeleteAttachment={handleDeleteAttachment}
            onClose={() => setShowAttachmentsDrawer(false)}
          />
        )}

        {loadingActiveDoc ? (
          <div className="flex flex-1 items-center justify-center bg-white text-sm text-[#A0AABF]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#35D7BB]" />
            Opening document…
          </div>
        ) : !activeDoc ? (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#FAFBFC] p-8 text-center">
            <h2 className="text-lg font-bold text-[#373D49]">Welcome to CESCTOR</h2>
            <p className="mt-1 max-w-md text-xs text-[#A0AABF]">
              Select a document from the left sidebar, create a new document, or import an
              existing <code>.md</code>, <code>.txt</code>, or <code>.docx</code> file.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleCreateBlankDocument}
                className="rounded bg-[#35D7BB] px-4 py-2 text-xs font-bold text-[#2B2F36] hover:opacity-90"
              >
                + New Document
              </button>
              <button
                type="button"
                onClick={() => setUploadModalMode('new-doc')}
                className="rounded bg-[#373D49] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Import File
              </button>
            </div>
          </div>
        ) : (
          <RichTextEditor
            documentId={activeDoc.id}
            content={draftContent}
            readOnly={activeDoc.accessRole === 'viewer'}
            showPreview={showPreview}
            nightMode={nightMode}
            showWordCount={showWordCount}
            showCharCount={showCharCount}
            onChange={(html) => {
              setDraftContent(html);
              setIsDirty(true);
            }}
          />
        )}

        <StatusFooter
          users={users}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
        />
      </main>

      {showSettingsDrawer && (
        <SettingsDrawer
          autoSaveEnabled={autoSaveEnabled}
          showWordCount={showWordCount}
          showCharCount={showCharCount}
          nightMode={nightMode}
          showPreview={showPreview}
          onToggleAutoSave={setAutoSaveEnabled}
          onToggleWordCount={setShowWordCount}
          onToggleCharCount={setShowCharCount}
          onToggleNightMode={setNightMode}
          onTogglePreview={setShowPreview}
          onClose={() => setShowSettingsDrawer(false)}
        />
      )}

      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}

      {showShareModal && activeDoc && (
        <ShareModal
          document={activeDoc}
          currentUser={currentUser}
          onClose={() => setShowShareModal(false)}
          onShare={handleShareDocument}
          onRevoke={handleRevokeShare}
        />
      )}

      {uploadModalMode && (
        <FileUploadModal
          initialMode={uploadModalMode}
          hasActiveEditableDoc={Boolean(activeDoc && activeDoc.accessRole !== 'viewer')}
          activeDocTitle={activeDoc?.title}
          onClose={() => setUploadModalMode(null)}
          onCreateNewDocFromFile={handleCreateNewDocFromFile}
          onImportIntoCurrentDoc={handleImportIntoCurrentDoc}
          onAttachFileToCurrentDoc={handleAttachFileToCurrentDoc}
        />
      )}
    </div>
  );
}
