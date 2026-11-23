'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  Trash2,
  Crown,
  Edit3,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { DocumentDetail, ShareRole, User } from '@/types';

interface ShareModalProps {
  document: DocumentDetail;
  allUsers: User[];
  currentUser: User;
  onClose: () => void;
  onShare: (email: string, role: ShareRole) => Promise<void>;
  onRevoke: (targetUserId: string) => Promise<void>;
}

export default function ShareModal({
  document,
  allUsers,
  currentUser,
  onClose,
  onShare,
  onRevoke,
}: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwner = document.accessRole === 'owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter or select a user email.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await onShare(email.trim(), role);
      setSuccessMsg(`Granted ${role} access to ${email.trim()}`);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sharing.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetEmail: string, nextRole: ShareRole) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await onShare(targetEmail, nextRole);
      setSuccessMsg(`Updated ${targetEmail} to ${nextRole}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (targetUserId: string, targetName: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await onRevoke(targetUserId);
      setSuccessMsg(`Removed access for ${targetName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Share &ldquo;{document.title}&rdquo;
            </h3>
            <p className="text-xs text-slate-500">
              Manage role-based document permissions (Owner, Editor, Viewer)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add Collaborator Form (Owner Only) */}
          {isOwner ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Grant Access to Teammate or Email
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter teammate email (e.g. sarah@ajaia.com)"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ShareRole)}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="editor">Editor (Can edit)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              You are viewing this document as an{' '}
              <strong className="uppercase text-slate-800">{document.accessRole}</strong>. Only
              the document owner (<strong>{document.ownerName}</strong>) can grant or revoke
              sharing permissions.
            </div>
          )}

          {/* People with access list */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              People with Access ({1 + document.shares.length})
            </h4>

            <div className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {/* Document Owner row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: document.ownerAvatarColor }}
                  >
                    {document.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      <span>{document.ownerName}</span>
                      {document.ownerId === currentUser.id && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{document.ownerEmail}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  <Crown className="h-3.5 w-3.5" />
                  Owner
                </span>
              </div>

              {/* Shared Collaborators rows */}
              {document.shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: share.userAvatarColor }}
                    >
                      {share.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <span>{share.userName}</span>
                        {share.userId === currentUser.id && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{share.userEmail}</p>
                    </div>
                  </div>

                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={share.role}
                        disabled={loading}
                        onChange={(e) =>
                          handleRoleChange(
                            share.userEmail,
                            e.target.value as ShareRole
                          )
                        }
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRemove(share.userId, share.userName)}
                        title="Revoke access"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        share.role === 'editor'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {share.role === 'editor' ? (
                        <Edit3 className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      {share.role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                  )}
                </div>
              ))}

              {document.shares.length === 0 && (
                <div className="px-4 py-4 text-center text-xs text-slate-400">
                  Private to owner — Not shared with anyone yet.
                </div>
              )}
            </div>
          </div>

          {/* Role legend */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>Role Permissions Matrix</span>
            </div>
            <p>
              <strong>Editor:</strong> Can edit document content, rename title, and upload/import
              files.
            </p>
            <p>
              <strong>Viewer:</strong> Read-only access. Editing controls and write APIs are locked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
