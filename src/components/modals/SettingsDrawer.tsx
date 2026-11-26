'use client';

import React from 'react';
import { X } from 'lucide-react';

interface SettingsDrawerProps {
  autoSaveEnabled: boolean;
  showWordCount: boolean;
  showCharCount: boolean;
  nightMode: boolean;
  showPreview: boolean;
  onToggleAutoSave: (next: boolean) => void;
  onToggleWordCount: (next: boolean) => void;
  onToggleCharCount: (next: boolean) => void;
  onToggleNightMode: (next: boolean) => void;
  onTogglePreview: (next: boolean) => void;
  onClose: () => void;
}

export default function SettingsDrawer({
  autoSaveEnabled,
  showWordCount,
  showCharCount,
  nightMode,
  showPreview,
  onToggleAutoSave,
  onToggleWordCount,
  onToggleCharCount,
  onToggleNightMode,
  onTogglePreview,
  onClose,
}: SettingsDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-80 bg-[#2B2F36] text-white h-full p-6 flex flex-col justify-between shadow-2xl">
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-[#4F535B] pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#35D7BB]">
              Cesctor Settings
            </h3>
            <button
              type="button"
              onClick={onClose}
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
                onChange={(e) => onToggleAutoSave(e.target.checked)}
                className="h-4 w-4 accent-[#35D7BB]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Word Count</span>
              <input
                type="checkbox"
                checked={showWordCount}
                onChange={(e) => onToggleWordCount(e.target.checked)}
                className="h-4 w-4 accent-[#35D7BB]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Character Count</span>
              <input
                type="checkbox"
                checked={showCharCount}
                onChange={(e) => onToggleCharCount(e.target.checked)}
                className="h-4 w-4 accent-[#35D7BB]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Night Mode</span>
              <input
                type="checkbox"
                checked={nightMode}
                onChange={(e) => onToggleNightMode(e.target.checked)}
                className="h-4 w-4 accent-[#35D7BB]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Split Live Preview</span>
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => onTogglePreview(e.target.checked)}
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
  );
}
