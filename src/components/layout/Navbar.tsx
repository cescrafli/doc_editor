'use client';

import React, { useState } from 'react';
import {
  Menu,
  Upload,
  Paperclip,
  Share2,
  Download,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Settings,
  HelpCircle,
  ChevronDown,
  UserCheck,
  LogIn,
} from 'lucide-react';
import type { DocumentDetail, User } from '@/types';

interface NavbarProps {
  activeDoc: DocumentDetail | null;
  users: User[];
  currentUser: User;
  showAttachmentsDrawer: boolean;
  showPreview: boolean;
  zenMode: boolean;
  showSettingsDrawer: boolean;
  showUserDropdown: boolean;
  onToggleSidebar: () => void;
  onOpenImport: () => void;
  onToggleAttachments: () => void;
  onOpenShare: () => void;
  onExportMarkdown: () => void;
  onExportHtml: (styled: boolean) => void;
  onPrintPdf: () => void;
  onTogglePreview: () => void;
  onToggleZenMode: () => void;
  onToggleSettings: () => void;
  onOpenShortcuts: () => void;
  onSetUserDropdown: (open: boolean) => void;
  onSwitchUser: (userId: string) => void;
  onCreateCustomUser: (email: string, name?: string) => Promise<void>;
}

export default function Navbar({
  activeDoc,
  users,
  currentUser,
  showAttachmentsDrawer,
  showPreview,
  zenMode,
  showSettingsDrawer,
  showUserDropdown,
  onToggleSidebar,
  onOpenImport,
  onToggleAttachments,
  onOpenShare,
  onExportMarkdown,
  onExportHtml,
  onPrintPdf,
  onTogglePreview,
  onToggleZenMode,
  onToggleSettings,
  onOpenShortcuts,
  onSetUserDropdown,
  onSwitchUser,
  onCreateCustomUser,
}: NavbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    await onCreateCustomUser(customEmail.trim(), customName.trim() || undefined);
    setCustomEmail('');
    setCustomName('');
  };

  return (
    <nav className="no-print h-14 bg-[#373D49] flex items-center justify-between px-4 z-20 shrink-0">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
          className="text-white hover:text-[#35D7BB] active:scale-[0.97] transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="text-[#35D7BB] font-bold text-xl tracking-wider select-none">
          CESCTOR
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onOpenImport}
          className="px-2.5 py-2 flex items-center gap-1.5 text-sm text-white hover:text-[#35D7BB] transition-colors"
          title="Import .md, .txt, .docx, or .html file"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden md:inline">Import</span>
        </button>

        {activeDoc && (
          <button
            type="button"
            onClick={onToggleAttachments}
            className={`px-2.5 py-2 flex items-center gap-1.5 text-sm transition-colors ${
              showAttachmentsDrawer ? 'text-[#35D7BB]' : 'text-white hover:text-[#35D7BB]'
            }`}
            title="Document attachments"
          >
            <Paperclip className="h-4 w-4" />
            <span className="hidden md:inline">Files ({activeDoc.attachments.length})</span>
          </button>
        )}

        {activeDoc && (
          <button
            type="button"
            onClick={onOpenShare}
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
                onClick={() => {
                  setShowExportMenu(false);
                  onExportMarkdown();
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-[#35D7BB]"
              >
                <span>Markdown</span>
                <span className="text-xs text-[#A0AABF]">.md</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportHtml(false);
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-[#35D7BB]"
              >
                <span>HTML</span>
                <span className="text-xs text-[#A0AABF]">.html</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportHtml(true);
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-[#35D7BB]"
              >
                <span>Styled HTML</span>
                <span className="text-xs text-[#A0AABF]">.html</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onPrintPdf();
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#D0D6E2] hover:bg-[#1D212A] hover:text-[#35D7BB]"
              >
                <span>PDF</span>
                <span className="text-xs text-[#A0AABF]">Print</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onTogglePreview}
          aria-pressed={showPreview}
          title={showPreview ? 'Hide preview' : 'Show preview'}
          className={`p-2 transition-colors ${
            showPreview ? 'text-white hover:text-[#35D7BB]' : 'text-[#35D7BB]'
          }`}
        >
          {showPreview ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={onToggleZenMode}
          title={zenMode ? 'Exit zen mode' : 'Enter zen mode'}
          className={`hidden sm:inline-flex p-2 transition-colors ${
            zenMode ? 'text-[#35D7BB]' : 'text-white hover:text-[#35D7BB]'
          }`}
        >
          {zenMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={onToggleSettings}
          title="Open settings"
          className={`p-2 transition-colors ${
            showSettingsDrawer ? 'text-[#35D7BB]' : 'text-white hover:text-[#35D7BB]'
          }`}
        >
          <Settings className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts & RBAC guide"
          className="hidden sm:inline-flex p-2 text-white hover:text-[#35D7BB] transition-colors"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Account Switcher Dropdown */}
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => onSetUserDropdown(!showUserDropdown)}
            title="Switch active user account to test sharing permissions"
            className="flex items-center gap-2 rounded bg-[#2B2F36] px-2.5 py-1.5 text-xs font-medium text-white hover:ring-1 hover:ring-[#35D7BB] transition-all"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden lg:inline max-w-[110px] truncate">{currentUser.name}</span>
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
                      onClick={() => onSwitchUser(u.id)}
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
                          <div className="text-xs font-semibold text-white">{u.name}</div>
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
                onSubmit={handleCustomSubmit}
                className="border-t border-[#373D49] bg-[#1D212A] p-3 space-y-2"
              >
                <div className="text-[11px] font-semibold text-[#A0AABF]">
                  Or sign in with custom email:
                </div>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Full Name (optional)"
                  className="w-full rounded border border-[#4F535B] bg-[#2B2F36] px-2.5 py-1.5 text-xs text-white placeholder:text-[#A0AABF] focus:border-[#35D7BB] focus:outline-none"
                />
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
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
  );
}
