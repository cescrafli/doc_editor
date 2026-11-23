'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Share2,
  Trash2,
  Save,
  Loader2,
  Search,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  Paperclip,
  Download,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Users,
  Menu,
  Pen,
  Settings,
  Maximize2,
  Minimize2,
  HelpCircle,
  CloudUpload,
  CloudDownload,
  Plug,
  ArrowDownToLine,
  LogIn,
  X,
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import ShareModal from './ShareModal';
import FileUploadModal, { type UploadMode } from './FileUploadModal';
import type {
  AccessRole,
  DocumentDetail,
  DocumentSummary,
  ShareRole,
  User,
} from '@/types';

type FilterTab = 'all' | 'owned' | 'shared';

function htmlToMarkdownRough(html: string): string {
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '_$1_')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function WorkspaceApp() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('user-rafli');
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentDetail | null>(null);

  // Dillinger Sidebar & UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openAccordions, setOpenAccordions] = useState<{
    services: boolean;
    importFrom: boolean;
    saveTo: boolean;
    documents: boolean;
  }>({
    services: false,
    importFrom: false,
    saveTo: false,
    documents: true,
  });

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Split preview, Zen Mode, Settings switches (Dillinger features)
  const [showPreview, setShowPreview] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showWordCount, setShowWordCount] = useState(true);
  const [showCharCount, setShowCharCount] = useState(true);

  // Local editor draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

  // Modals & Dropdowns
  const [showShareModal, setShowShareModal] = useState(false);
  const [uploadModalMode, setUploadModalMode] = useState<UploadMode | null>(null);
  const [showAttachmentsDrawer, setShowAttachmentsDrawer] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const [customEmailInput, setCustomEmailInput] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingActiveDoc, setLoadingActiveDoc] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'info' | 'error' | 'success';
    text: string;
  } | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const currentUser = useMemo(
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
    const savedUser =
      typeof window !== 'undefined' ? localStorage.getItem('ajaia_active_user_id') : null;
    if (savedUser) {
      setCurrentUserId(savedUser);
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
          body: JSON.stringify({
            title: finalTitle,
            content: finalContent,
          }),
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
          content:
            '<h1>Welcome to Cesctor</h1><p>A clean, distraction-free collaborative document editor. Type on the left, see the rendered output on the right.</p><h2>Text Formatting</h2><p>Cesctor makes it easy to format text. You can write in <strong>bold</strong>, <em>italic</em>, <u>underline</u>, or <s>strikethrough</s>. Use <code>inline code</code> for technical terms.</p><h2>Lists</h2><ul><li>Import files from local Markdown (.md), Plain Text (.txt), Word (.docx), or HTML</li><li>Share documents with teammates as <strong>Editor</strong> or <strong>Viewer</strong></li><li>Export to Markdown, HTML, or PDF</li></ul>',
        }),
      });
      const created: DocumentDetail = data.document;
      await loadDocumentsList(false, created.id);
      setBannerMessage({
        type: 'success',
        text: 'Created new Cesctor document.',
      });
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
      await apiFetch(`/api/documents/${activeDoc.id}`, {
        method: 'DELETE',
      });
      setBannerMessage({
        type: 'info',
        text: `Deleted "${activeDoc.title}".`,
      });
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

    const data = await apiFetch('/api/upload/parse', {
      method: 'POST',
      body: formData,
    });
    const created: DocumentDetail = data.document;
    await loadDocumentsList(false, created.id);
    setBannerMessage({
      type: 'success',
      text: `Imported "${file.name}" as a new editable document!`,
    });
  };

  const handleImportIntoCurrentDoc = async (
    file: File,
    behavior: 'append' | 'replace'
  ) => {
    if (!activeDoc) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('createDocument', 'false');

    const data = await apiFetch('/api/upload/parse', {
      method: 'POST',
      body: formData,
    });
    const importedHtml: string = data.parsed.htmlContent;
    const nextContent =
      behavior === 'replace'
        ? importedHtml
        : `${draftContent}<hr />${importedHtml}`;

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
        `/api/documents/${activeDoc.id}/attachments?attachmentId=${encodeURIComponent(
          attachmentId
        )}`,
        { method: 'DELETE' }
      );
      setActiveDoc(data.document);
      await loadDocumentsList(false, activeDoc.id);
      setBannerMessage({
        type: 'info',
        text: `Removed attachment "${fileName}".`,
      });
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
      localStorage.setItem('ajaia_active_user_id', userId);
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

  const handleCreateCustomUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmailInput.trim()) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customEmailInput.trim(),
          name: customNameInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');
      const newUser: User = data.user;
      const uRes = await fetch('/api/users').then((r) => r.json());
      if (uRes.users) setUsers(uRes.users);
      setCustomEmailInput('');
      setCustomNameInput('');
      handleSwitchUser(newUser.id);
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid email address.',
      });
    }
  };

  const handleExportMarkdown = () => {
    if (!activeDoc) return;
    const md = htmlToMarkdownRough(draftContent);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(draftTitle || 'document').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportHtml = (styled: boolean) => {
    if (!activeDoc) return;
    const htmlPayload = styled
      ? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${draftTitle}</title><style>body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 20px;line-height:1.7;color:#373D49}h1,h2,h3{font-family:sans-serif;border-bottom:1px solid #eee;padding-bottom:6px}</style></head><body>${draftContent}</body></html>`
      : draftContent;
    const blob = new Blob([htmlPayload], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(draftTitle || 'document').toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const ownedCount = documents.filter((d) => d.accessRole === 'owner').length;
  const sharedCount = documents.filter((d) => d.accessRole !== 'owner').length;

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
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
    });
  }, [documents, filterTab, searchQuery]);

  const renderSidebarRoleBadge = (role: AccessRole) => {
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
  };

  const renderHeaderRoleBadge = (role: AccessRole) => {
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
  };

  const toggleAccordion = (key: keyof typeof openAccordions) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-dvh overflow-hidden relative bg-white">
      {/* =====================================================================
          A. LEFT COLLAPSIBLE SIDEBAR (Dillinger #2B2F36 Sidebar)
         ===================================================================== */}
      {!zenMode && (
        <aside
          className={`no-print fixed sm:relative w-[270px] shrink-0 bg-[#2B2F36] h-dvh flex flex-col z-30 transition-all duration-200 ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full sm:-ml-[270px]'
          }`}
        >
          {/* Scrollable Accordion Sections */}
          <nav className="flex-1 overflow-y-auto px-4 pt-3">
            {/* 1. SERVICES */}
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
                    onClick={() => activeDoc && setShowShareModal(true)}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
                  >
                    <span>Role-Based Sharing</span>
                    <span className="text-xs text-[#35D7BB]">Configure</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(true)}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
                  >
                    <span>Switch Account</span>
                    <span className="text-xs text-[#35D7BB]">{currentUser.name.split(' ')[0]}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. IMPORT FROM */}
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
                    onClick={() => setUploadModalMode('new-doc')}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
                  >
                    <Upload className="h-4 w-4 text-[#35D7BB]" />
                    <span>File as New Document</span>
                  </button>
                  <button
                    type="button"
                    disabled={!activeDoc || activeDoc.accessRole === 'viewer'}
                    onClick={() => setUploadModalMode('import-into-current')}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white disabled:opacity-40"
                  >
                    <FileText className="h-4 w-4 text-[#35D7BB]" />
                    <span>Import into Active Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={!activeDoc || activeDoc.accessRole === 'viewer'}
                    onClick={() => setUploadModalMode('attach-to-current')}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white disabled:opacity-40"
                  >
                    <Paperclip className="h-4 w-4 text-[#35D7BB]" />
                    <span>Attach Reference File</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. SAVE TO */}
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
                    onClick={() => handleSaveDocument(draftTitle, draftContent)}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
                  >
                    <Save className="h-4 w-4 text-[#35D7BB]" />
                    <span>Turso Cloud Database</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
                  >
                    <Download className="h-4 w-4 text-[#35D7BB]" />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportHtml(true)}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
                  >
                    <Download className="h-4 w-4 text-[#35D7BB]" />
                    <span>Styled HTML (.html)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-white"
                  >
                    <Download className="h-4 w-4 text-[#35D7BB]" />
                    <span>PDF Document</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. DOCUMENTS (Expanded by default, with Owned vs Shared filter tabs) */}
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
                  {/* Owned vs Shared Filter Pills */}
                  <div className="grid grid-cols-3 gap-1 rounded bg-[#1D212A] p-1 text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
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
                      onClick={() => setFilterTab('owned')}
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
                      onClick={() => setFilterTab('shared')}
                      className={`rounded py-1 transition-colors ${
                        filterTab === 'shared'
                          ? 'bg-[#373D49] text-[#35D7BB] font-semibold'
                          : 'text-[#A0AABF] hover:text-white'
                      }`}
                    >
                      Shared ({sharedCount})
                    </button>
                  </div>

                  {/* Compact Document Search */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#A0AABF]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter documents…"
                      className="w-full rounded bg-[#1D212A] py-1.5 pl-8 pr-2.5 text-xs text-white placeholder:text-[#A0AABF]/70 focus:outline-none focus:ring-1 focus:ring-[#35D7BB]"
                    />
                  </div>

                  {/* Documents List */}
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
                              onClick={() => loadDocumentDetail(doc.id)}
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
                                {renderSidebarRoleBadge(doc.accessRole)}
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

          {/* Dillinger Iconic 3 Footer Action Buttons */}
          <div className="p-4 space-y-2.5 border-t border-[#373D49]/60">
            <button
              type="button"
              onClick={handleCreateBlankDocument}
              className="w-full bg-[#35D7BB] text-[#2B2F36] py-2 px-4 rounded font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Document</span>
            </button>

            <button
              type="button"
              disabled={!activeDoc || activeDoc.accessRole === 'viewer' || saveState === 'saving'}
              onClick={() => handleSaveDocument(draftTitle, draftContent)}
              className="w-full bg-[#4A5261] text-white py-2 px-4 rounded font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saveState === 'saving' ? 'Saving…' : 'Save Session'}</span>
            </button>

            <button
              type="button"
              disabled={!activeDoc || activeDoc.accessRole !== 'owner'}
              onClick={handleDeleteCurrentDocument}
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
      )}

      {/* =====================================================================
          B. MAIN WORKSPACE COLUMN (Navbar + Sub-Header + Split Editor/Preview + Footer)
         ===================================================================== */}
      <main className="flex-1 flex flex-col min-w-0 h-dvh">
        {/* 1. TOP NAVIGATION BAR (Dillinger #373D49 Navbar with CESCTOR wordmark) */}
        <nav className="no-print h-14 bg-[#373D49] flex items-center justify-between px-4 z-20 shrink-0">
          {/* Left: Sidebar Toggle + CESCTOR Wordmark */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              title="Toggle sidebar"
              className="text-white hover:text-[#35D7BB] active:scale-[0.97] transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="text-[#35D7BB] font-bold text-xl tracking-wider select-none">
              CESCTOR
            </span>
          </div>

          {/* Right: Dillinger Action Controls + Share + Account Switcher */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Import File */}
            <button
              type="button"
              onClick={() => setUploadModalMode('new-doc')}
              className="px-2.5 py-2 flex items-center gap-1.5 text-sm text-white hover:text-[#35D7BB] transition-colors"
              title="Import .md, .txt, .docx, or .html file"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden md:inline">Import</span>
            </button>

            {/* Attachments / Files */}
            {activeDoc && (
              <button
                type="button"
                onClick={() => setShowAttachmentsDrawer((v) => !v)}
                className={`px-2.5 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                  showAttachmentsDrawer
                    ? 'text-[#35D7BB]'
                    : 'text-white hover:text-[#35D7BB]'
                }`}
                title="Document attachments"
              >
                <Paperclip className="h-4 w-4" />
                <span className="hidden md:inline">
                  Files ({activeDoc.attachments.length})
                </span>
              </button>
            )}

            {/* Share Modal Trigger */}
            {activeDoc && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="px-2.5 py-2 flex items-center gap-1.5 text-sm text-white hover:text-[#35D7BB] transition-colors"
                title="Manage document sharing and permissions"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
                <span className="rounded-full bg-[#2B2F36] px-1.5 py-0.5 text-[10px] font-bold text-[#35D7BB]">
                  {1 + activeDoc.shares.length}
                </span>
              </button>
            )}

            {/* Export as Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu((v) => !v)}
                className={`px-2.5 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                  showExportMenu ? 'text-[#35D7BB]' : 'text-white hover:text-[#35D7BB]'
                }`}
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">Export as</span>
              </button>

              {showExportMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1 w-44 rounded border border-[#4F535B] bg-[#2B2F36] py-1 shadow-xl z-50"
                >
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-[#35D7BB]"
                  >
                    <span>Markdown</span>
                    <span className="text-xs text-[#A0AABF]">.md</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportHtml(false)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-[#35D7BB]"
                  >
                    <span>HTML</span>
                    <span className="text-xs text-[#A0AABF]">.html</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportHtml(true)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-[#35D7BB]"
                  >
                    <span>Styled HTML</span>
                    <span className="text-xs text-[#A0AABF]">.html</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      window.print();
                    }}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-[#35D7BB]"
                  >
                    <span>PDF</span>
                    <span className="text-xs text-[#A0AABF]">Print</span>
                  </button>
                </div>
              )}
            </div>

            {/* Toggle Live Preview (Eye Icon) */}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              aria-pressed={showPreview}
              title={showPreview ? 'Hide preview' : 'Show preview'}
              className={`p-2 transition-colors ${
                showPreview ? 'text-white hover:text-[#35D7BB]' : 'text-[#35D7BB]'
              }`}
            >
              {showPreview ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>

            {/* Zen Mode Toggle */}
            <button
              type="button"
              onClick={() => setZenMode((v) => !v)}
              title={zenMode ? 'Exit zen mode' : 'Enter zen mode'}
              className={`hidden sm:inline-flex p-2 transition-colors ${
                zenMode ? 'text-[#35D7BB]' : 'text-white hover:text-[#35D7BB]'
              }`}
            >
              {zenMode ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>

            {/* Settings Slide-Over Toggle */}
            <button
              type="button"
              onClick={() => setShowSettingsDrawer((v) => !v)}
              title="Open settings"
              className={`p-2 transition-colors ${
                showSettingsDrawer ? 'text-[#35D7BB]' : 'text-white hover:text-[#35D7BB]'
              }`}
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Keyboard Shortcuts / Guide Modal */}
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              title="Keyboard shortcuts & RBAC guide"
              className="hidden sm:inline-flex p-2 text-white hover:text-[#35D7BB] transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            {/* Account Switcher Dropdown (1-Click Multi-User Testing) */}
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setShowUserDropdown((v) => !v)}
                title="Switch active user account to test sharing permissions"
                className="flex items-center gap-2 rounded bg-[#2B2F36] px-2.5 py-1.5 text-xs font-medium text-white hover:ring-1 hover:ring-[#35D7BB] transition-all"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden lg:inline max-w-[110px] truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#A0AABF]" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-[#4F535B] bg-[#2B2F36] text-white shadow-2xl z-50">
                  <div className="border-b border-[#373D49] bg-[#1D212A] px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#35D7BB]">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Switch Active Account (Test Sharing)</span>
                    </div>
                    <p className="text-[11px] text-[#A0AABF]">
                      Switch seeded users in 1 click to verify Owner, Editor &amp; Viewer roles
                    </p>
                  </div>

                  <div className="max-h-60 divide-y divide-[#373D49] overflow-y-auto">
                    {users.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSwitchUser(u.id)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                            isCurrent ? 'bg-[#1D212A]' : 'hover:bg-[#373D49]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: u.avatarColor }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-[#A0AABF]">{u.email}</div>
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="rounded bg-[#35D7BB] px-2 py-0.5 text-[10px] font-bold text-[#2B2F36]">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <form
                    onSubmit={handleCreateCustomUser}
                    className="border-t border-[#373D49] bg-[#1D212A] p-3 space-y-2"
                  >
                    <div className="text-[11px] font-semibold text-[#A0AABF]">
                      Or sign in with custom email:
                    </div>
                    <input
                      type="text"
                      value={customNameInput}
                      onChange={(e) => setCustomNameInput(e.target.value)}
                      placeholder="Full Name (optional)"
                      className="w-full rounded border border-[#4F535B] bg-[#2B2F36] px-2.5 py-1.5 text-xs text-white placeholder:text-[#A0AABF] focus:border-[#35D7BB] focus:outline-none"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        required
                        value={customEmailInput}
                        onChange={(e) => setCustomEmailInput(e.target.value)}
                        placeholder="reviewer@ajaia.com"
                        className="flex-1 rounded border border-[#4F535B] bg-[#2B2F36] px-2.5 py-1.5 text-xs text-white placeholder:text-[#A0AABF] focus:border-[#35D7BB] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded bg-[#35D7BB] px-3 py-1.5 text-xs font-bold text-[#2B2F36] hover:opacity-90"
                      >
                        <LogIn className="h-3 w-3" />
                        <span>Switch</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Optional Status Toast Banner */}
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

        {/* 2. DOCUMENT TITLE SUB-HEADER BAR (Dillinger h-14 white bar with Title, "Saved", Pen icon) */}
        {activeDoc && (
          <div
            className={`no-print h-14 flex items-center justify-between px-4 border-b shrink-0 ${
              nightMode
                ? 'bg-[#2B2F36] border-[#373D49] text-white'
                : 'bg-white border-[#E8E8E8] text-[#373D49]'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isEditingTitle && activeDoc.accessRole !== 'viewer' ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={draftTitle}
                  autoFocus
                  onChange={(e) => {
                    setDraftTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  onBlur={() => {
                    setIsEditingTitle(false);
                    handleSaveDocument(draftTitle, draftContent);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false);
                      handleSaveDocument(draftTitle, draftContent);
                    } else if (e.key === 'Escape') {
                      setDraftTitle(activeDoc.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="max-w-md rounded border border-[#35D7BB] bg-transparent px-2 py-1 text-base font-semibold focus:outline-none"
                />
              ) : (
                <h2
                  onClick={() => {
                    if (activeDoc.accessRole !== 'viewer') {
                      setIsEditingTitle(true);
                    }
                  }}
                  className={`font-semibold text-base truncate ${
                    activeDoc.accessRole !== 'viewer' ? 'cursor-pointer hover:text-[#35D7BB]' : ''
                  }`}
                  title={
                    activeDoc.accessRole !== 'viewer'
                      ? 'Click to rename document'
                      : 'View-only document'
                  }
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

              {activeDoc.accessRole !== 'viewer' && !isEditingTitle && (
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

            {/* Right metadata in sub-header: Role badge & Owner */}
            <div className="flex items-center gap-2.5 text-xs shrink-0">
              {renderHeaderRoleBadge(activeDoc.accessRole)}
              <span className="hidden md:inline text-[#A0AABF]">
                Owner: <strong className={nightMode ? 'text-white' : 'text-[#373D49]'}>{activeDoc.ownerName}</strong>
              </span>
              {activeDoc.accessRole !== 'viewer' && (
                <button
                  type="button"
                  onClick={() => setUploadModalMode('import-into-current')}
                  className="hidden sm:inline-flex items-center gap-1 rounded border border-[#E8E8E8] px-2.5 py-1 text-xs font-medium text-[#373D49] hover:border-[#35D7BB] hover:text-[#2B2F36] bg-white"
                >
                  <Upload className="h-3 w-3 text-[#35D7BB]" />
                  <span>Import into Draft</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Document Attachments Bar (When toggled) */}
        {showAttachmentsDrawer && activeDoc && (
          <div className="no-print border-b border-[#E8E8E8] bg-[#FAFBFC] px-4 py-3 shrink-0">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[#35D7BB]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#373D49]">
                  Document Attachments ({activeDoc.attachments.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeDoc.accessRole !== 'viewer' && (
                  <button
                    type="button"
                    onClick={() => setUploadModalMode('attach-to-current')}
                    className="inline-flex items-center gap-1 rounded bg-[#35D7BB] px-2.5 py-1 text-xs font-semibold text-[#2B2F36] hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Upload Attachment</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAttachmentsDrawer(false)}
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

                    {att.extractedHtml && activeDoc.accessRole !== 'viewer' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const next = `${draftContent}<hr />${att.extractedHtml}`;
                          setDraftContent(next);
                          await handleSaveDocument(draftTitle, next);
                          setBannerMessage({
                            type: 'success',
                            text: `Inserted content from "${att.fileName}" into editor.`,
                          });
                        }}
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

                    {activeDoc.accessRole !== 'viewer' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id, att.fileName)}
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
        )}

        {/* 3. MAIN SPLIT EDITOR / LIVE PREVIEW WORKSPACE */}
        {loadingActiveDoc ? (
          <div className="flex flex-1 items-center justify-center bg-white text-sm text-[#A0AABF]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#35D7BB]" />
            Opening document…
          </div>
        ) : !activeDoc ? (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#FAFBFC] p-8 text-center">
            <h2 className="text-lg font-bold text-[#373D49]">
              Welcome to CESCTOR
            </h2>
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

        {/* 4. BOTTOM DARK BAR (Dillinger #logobar #2B2F36 footer) */}
        <div
          id="logobar"
          className="no-print min-h-11 bg-[#2B2F36] px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#A0AABF] shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <span className="rounded bg-[#1D212A] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#35D7BB]">
              CESCTOR
            </span>
            <span className="truncate text-xs text-[#D0D6E2]">
              Collaborative Rich-Text &amp; Markdown Workspace — Turso Cloud SQLite + Role-Based Sharing
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[11px] text-[#A0AABF]">Quick Switch User:</span>
            {users.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSwitchUser(u.id)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  u.id === currentUser.id
                    ? 'bg-[#35D7BB] text-[#2B2F36] font-bold'
                    : 'bg-[#1D212A] text-[#D0D6E2] hover:text-white'
                }`}
              >
                {u.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* =====================================================================
          C. DILLINGER SETTINGS SLIDE-OVER DRAWER
         ===================================================================== */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-80 bg-[#2B2F36] text-white h-full p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#4F535B] pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#35D7BB]">
                  Cesctor Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer(false)}
                  className="text-[#A0AABF] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-sm">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Auto Save (1.2s)</span>
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#35D7BB]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span>Word Count</span>
                  <input
                    type="checkbox"
                    checked={showWordCount}
                    onChange={(e) => setShowWordCount(e.target.checked)}
                    className="h-4 w-4 accent-[#35D7BB]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span>Character Count</span>
                  <input
                    type="checkbox"
                    checked={showCharCount}
                    onChange={(e) => setShowCharCount(e.target.checked)}
                    className="h-4 w-4 accent-[#35D7BB]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span>Night Mode</span>
                  <input
                    type="checkbox"
                    checked={nightMode}
                    onChange={(e) => setNightMode(e.target.checked)}
                    className="h-4 w-4 accent-[#35D7BB]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span>Split Live Preview</span>
                  <input
                    type="checkbox"
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                    className="h-4 w-4 accent-[#35D7BB]"
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-[#4F535B] pt-4 text-xs text-[#A0AABF]">
              CESCTOR v1.0 — Powered by Next.js, TipTap &amp; Turso Cloud SQLite
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts & RBAC Help Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#4F535B] bg-[#2B2F36] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#4F535B] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#35D7BB]">
                Cesctor Shortcuts &amp; Permissions Guide
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
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
                  <strong className="text-[#35D7BB]">Owner:</strong> Full edit, rename, share,
                  upload attachments, and delete document.
                </li>
                <li>
                  <strong className="text-emerald-300">Editor:</strong> Edit content, rename,
                  and import/upload files.
                </li>
                <li>
                  <strong className="text-amber-300">Viewer:</strong> Read-only access (editor
                  is locked and write APIs return 403).
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && activeDoc && (
        <ShareModal
          document={activeDoc}
          allUsers={users}
          currentUser={currentUser}
          onClose={() => setShowShareModal(false)}
          onShare={handleShareDocument}
          onRevoke={handleRevokeShare}
        />
      )}

      {/* File Upload / Import Modal */}
      {uploadModalMode && (
        <FileUploadModal
          initialMode={uploadModalMode}
          hasActiveEditableDoc={Boolean(
            activeDoc && activeDoc.accessRole !== 'viewer'
          )}
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
