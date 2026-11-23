'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Share2,
  Trash2,
  Save,
  Check,
  Loader2,
  Search,
  Crown,
  Edit3,
  Eye,
  Paperclip,
  Download,
  ChevronDown,
  UserCheck,
  FolderOpen,
  Users,
  Sparkles,
  Printer,
  FileDown,
  AlertTriangle,
  ArrowDownToLine,
  LogIn,
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

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Local editor draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

  // UI Modals & Drawers
  const [showShareModal, setShowShareModal] = useState(false);
  const [uploadModalMode, setUploadModalMode] = useState<UploadMode | null>(null);
  const [showAttachmentsDrawer, setShowAttachmentsDrawer] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingActiveDoc, setLoadingActiveDoc] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'info' | 'error' | 'success';
    text: string;
  } | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = useMemo(
    () =>
      users.find((u) => u.id === currentUserId) || {
        id: 'user-rafli',
        name: 'Rafli Prasetyo',
        email: 'raflimudji@gmail.com',
        avatarColor: '#4f46e5',
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

  // Load users on mount
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFetch]
  );

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

  // Reload accessible documents whenever currentUserId changes
  useEffect(() => {
    loadDocumentsList(true, activeDoc?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const handleSaveDocument = useCallback(
    async (titleToSave?: string, contentToSave?: string) => {
      if (!activeDoc || activeDoc.accessRole === 'viewer') return;
      const finalTitle = (titleToSave ?? draftTitle).trim() || 'Untitled Document';
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

        // Refresh sidebar summary list silently
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

  // Debounced auto-save when draftContent or draftTitle changes
  useEffect(() => {
    if (!isDirty || !activeDoc || activeDoc.accessRole === 'viewer') return;
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
  }, [draftTitle, draftContent, isDirty, activeDoc, handleSaveDocument]);

  const handleCreateBlankDocument = async () => {
    try {
      const data = await apiFetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Document',
          content: '<h1>Untitled Document</h1><p>Start writing here…</p>',
        }),
      });
      const created: DocumentDetail = data.document;
      await loadDocumentsList(false, created.id);
      setBannerMessage({
        type: 'success',
        text: 'Created new blank document.',
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
    // Refresh users list in case a new email user was created
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

  // File Upload Handlers
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
  };

  // Filtered sidebar documents
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

  const renderRoleBadge = (role: AccessRole) => {
    if (role === 'owner') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/60">
          <Crown className="h-3 w-3" />
          Owner
        </span>
      );
    }
    if (role === 'editor') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
          <Edit3 className="h-3 w-3" />
          Shared • Editor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/60">
        <Eye className="h-3 w-3" />
        Shared • Viewer
      </span>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Application Navigation Bar */}
      <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-2xs sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                Ajaia Docs
              </span>
              <span className="hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 sm:inline-block">
                Collaborative Workspace
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-500 sm:block">
              Rich-text editing • File import (.md, .txt, .docx) • Role-based sharing
            </p>
          </div>
        </div>

        {/* Right Global Actions & Account Switcher */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setUploadModalMode('new-doc')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Upload / Import File</span>
            <span className="sm:hidden">Upload</span>
          </button>

          <button
            type="button"
            onClick={handleCreateBlankDocument}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Document</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* Reviewer Account Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserDropdown((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 py-1 pl-1.5 pr-2.5 text-left transition-colors hover:bg-slate-100"
              title="Switch active user to test multi-user sharing permissions"
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-2xs"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold leading-none text-slate-900">
                  {currentUser.name}
                </div>
                <div className="mt-0.5 text-[10px] leading-none text-slate-500">
                  {currentUser.email}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
                <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Switch Active User (Test Sharing)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Switch accounts instantly to test Owner, Editor &amp; Viewer roles
                  </p>
                </div>

                <div className="max-h-60 divide-y divide-slate-100 overflow-y-auto">
                  {users.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSwitchUser(u.id)}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                          isCurrent ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
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
                            <div className="text-xs font-semibold text-slate-900">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Email Login Form */}
                <form
                  onSubmit={handleCreateCustomUser}
                  className="border-t border-slate-100 bg-slate-50 p-3 space-y-2"
                >
                  <div className="text-[11px] font-semibold text-slate-600">
                    Or sign in with custom email:
                  </div>
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    placeholder="Full Name (optional)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="email"
                      required
                      value={customEmailInput}
                      onChange={(e) => setCustomEmailInput(e.target.value)}
                      placeholder="reviewer@ajaia.com"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
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
      </header>

      {/* Optional Toast / Status Banner */}
      {bannerMessage && (
        <div
          className={`no-print flex items-center justify-between border-b px-6 py-2 text-xs font-medium ${
            bannerMessage.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : bannerMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-indigo-200 bg-indigo-50 text-indigo-800'
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="ml-4 text-xs underline opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Workspace: Left Sidebar (Documents & Ownership Tabs) + Right Editor Canvas */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Sidebar */}
        <aside className="no-print flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-80 lg:border-b-0 lg:border-r">
          {/* Active User Summary Card */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Workspace Access
              </span>
              <span className="text-[11px] font-medium text-indigo-600">
                {ownedCount} Owned • {sharedCount} Shared
              </span>
            </div>

            {/* Distinct Filter Tabs: All vs Owned by Me vs Shared with Me */}
            <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`rounded-lg py-1.5 transition-all ${
                  filterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('owned')}
                className={`inline-flex items-center justify-center gap-1 rounded-lg py-1.5 transition-all ${
                  filterTab === 'owned'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderOpen className="h-3 w-3" />
                <span>Owned ({ownedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('shared')}
                className={`inline-flex items-center justify-center gap-1 rounded-lg py-1.5 transition-all ${
                  filterTab === 'shared'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="h-3 w-3" />
                <span>Shared ({sharedCount})</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative mt-2.5">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter documents by title or owner…"
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Document Cards List */}
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-72 lg:max-h-[calc(100vh-12rem)]">
            {loadingDocs ? (
              <div className="flex items-center justify-center py-12 text-xs text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-600" />
                Loading documents…
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">
                  No documents match this view
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {filterTab === 'owned'
                    ? 'Create a new document or import a file to get started.'
                    : filterTab === 'shared'
                    ? 'No documents have been shared with this account yet.'
                    : 'Try clearing your search filter or create a new document.'}
                </p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => loadDocumentDetail(doc.id)}
                    className={`group flex w-full flex-col gap-1.5 px-4 py-3.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`line-clamp-1 text-sm font-semibold ${
                          isSelected ? 'text-indigo-950' : 'text-slate-900'
                        }`}
                      >
                        {doc.title}
                      </span>
                      {renderRoleBadge(doc.accessRole)}
                    </div>

                    <p className="line-clamp-2 text-xs text-slate-500">{doc.excerpt}</p>

                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: doc.ownerAvatarColor }}
                        />
                        <span>
                          {doc.accessRole === 'owner'
                            ? 'Owned by you'
                            : `Owner: ${doc.ownerName}`}
                        </span>
                      </span>

                      <div className="flex items-center gap-2">
                        {doc.shareCount > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 text-slate-500"
                            title={`Shared with ${doc.shareCount} collaborator(s)`}
                          >
                            <Users className="h-3 w-3" />
                            {doc.shareCount}
                          </span>
                        )}
                        {doc.attachmentCount > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 text-slate-500"
                            title={`${doc.attachmentCount} attachment(s)`}
                          >
                            <Paperclip className="h-3 w-3" />
                            {doc.attachmentCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Main Document Editor Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {loadingActiveDoc ? (
            <div className="flex h-96 items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
              Opening document…
            </div>
          ) : !activeDoc ? (
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900">
                Select or Create a Document
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose a document from the left sidebar, create a blank document, or import an
                existing <code>.md</code>, <code>.txt</code>, or <code>.docx</code> file.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCreateBlankDocument}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Blank Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadModalMode('new-doc')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4 text-indigo-600" />
                  <span>Import File</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-4">
              {/* Document Top Control Bar */}
              <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                {/* Inline Document Title Input + Ownership Metadata */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draftTitle}
                      disabled={activeDoc.accessRole === 'viewer'}
                      onChange={(e) => {
                        setDraftTitle(e.target.value);
                        setIsDirty(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                          handleSaveDocument(draftTitle, draftContent);
                        }
                      }}
                      placeholder="Document Title…"
                      className="w-full rounded-lg border border-transparent px-2 py-1 text-lg font-bold text-slate-900 transition-colors hover:border-slate-200 focus:border-indigo-500 focus:bg-slate-50/50 focus:outline-none disabled:cursor-not-allowed disabled:hover:border-transparent"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 px-2 text-xs text-slate-500">
                    {renderRoleBadge(activeDoc.accessRole)}
                    <span>•</span>
                    <span>
                      Owner: <strong className="text-slate-700">{activeDoc.ownerName}</strong>
                    </span>
                    <span>•</span>
                    {/* Live Persistence Status Indicator */}
                    {saveState === 'saving' && (
                      <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving changes…
                      </span>
                    )}
                    {saveState === 'saved' && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <Check className="h-3.5 w-3.5" />
                        Saved to database
                      </span>
                    )}
                    {saveState === 'unsaved' && (
                      <span className="text-amber-600 font-medium">Unsaved edits…</span>
                    )}
                    {saveState === 'error' && (
                      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        Save failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Save, Import/Attach, Attachments Drawer, Export, Share, Delete */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeDoc.accessRole !== 'viewer' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveDocument(draftTitle, draftContent)}
                        disabled={saveState === 'saving'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        title="Save document now"
                      >
                        <Save className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Save</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadModalMode('import-into-current')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        title="Import content from .md, .txt, or .docx into this document"
                      >
                        <Upload className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Import File</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAttachmentsDrawer((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      showAttachmentsDrawer
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Files ({activeDoc.attachments.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Export document as Markdown (.md)"
                  >
                    <FileDown className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">.MD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Print or Save as PDF"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                    <span className="rounded-full bg-indigo-500 px-1.5 py-0.2 text-[10px]">
                      {1 + activeDoc.shares.length}
                    </span>
                  </button>

                  {activeDoc.accessRole === 'owner' && (
                    <button
                      type="button"
                      onClick={handleDeleteCurrentDocument}
                      title="Delete document (Owner only)"
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Document Attachments Drawer */}
              {showAttachmentsDrawer && (
                <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Document Attachments ({activeDoc.attachments.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Files associated with this document. Text/Markdown/Word attachments can
                        also be inserted into the editor.
                      </p>
                    </div>
                    {activeDoc.accessRole !== 'viewer' && (
                      <button
                        type="button"
                        onClick={() => setUploadModalMode('attach-to-current')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Attachment</span>
                      </button>
                    )}
                  </div>

                  {activeDoc.attachments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No attachments uploaded to this document yet.
                    </div>
                  ) : (
                    <div className="mt-3 divide-y divide-slate-100">
                      {activeDoc.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-700">
                              {att.fileType}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {att.fileName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {(att.fileSize / 1024).toFixed(1)} KB • Uploaded by{' '}
                                {att.uploadedByName}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {att.extractedHtml && activeDoc.accessRole !== 'viewer' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const next = `${draftContent}<hr />${att.extractedHtml}`;
                                  setDraftContent(next);
                                  await handleSaveDocument(draftTitle, next);
                                  setBannerMessage({
                                    type: 'success',
                                    text: `Inserted content from "${att.fileName}" into document.`,
                                  });
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                              >
                                <ArrowDownToLine className="h-3 w-3" />
                                <span>Insert into Doc</span>
                              </button>
                            )}

                            <a
                              href={`/api/documents/${activeDoc.id}/attachments/${att.id}?actingUserId=${encodeURIComponent(
                                currentUser.id
                              )}`}
                              download={att.fileName}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download</span>
                            </a>

                            {activeDoc.accessRole !== 'viewer' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteAttachment(att.id, att.fileName)
                                }
                                className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Remove attachment"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rich-Text Document Editor */}
              <RichTextEditor
                documentId={activeDoc.id}
                content={draftContent}
                readOnly={activeDoc.accessRole === 'viewer'}
                onChange={(html) => {
                  setDraftContent(html);
                  setIsDirty(true);
                }}
              />
            </div>
          )}
        </main>
      </div>

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
