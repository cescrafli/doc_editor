'use client';

import React from 'react';
import type { User } from '@/types';

interface StatusFooterProps {
  users: User[];
  currentUser: User;
  onSwitchUser: (userId: string) => void;
}

export default function StatusFooter({
  users,
  currentUser,
  onSwitchUser,
}: StatusFooterProps) {
  return (
    <div
      id="logobar"
      className="no-print min-h-11 bg-[#2B2F36] px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#A0AABF] shrink-0"
    >
      <div className="flex items-center gap-2.5">
        <span className="rounded bg-[#1D212A] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#35D7BB]">
          CESCTOR
        </span>
        <span className="truncate text-xs text-[#D0D6E2]">
          Collaborative Rich-Text &amp; Markdown Workspace — Turso Cloud SQLite + Role-Based
          Sharing
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1.5">
        <span className="text-[11px] text-[#A0AABF]">Quick Switch User:</span>
        {users.slice(0, 4).map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onSwitchUser(u.id)}
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
  );
}
