import { type Client } from '@libsql/client';
import { randomUUID } from 'crypto';
import { ensureDbReady } from './db';
import type {
  AccessRole,
  DocumentAttachment,
  DocumentDetail,
  DocumentShare,
  DocumentSummary,
  ShareRole,
  User,
} from '@/types';

export class ServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

function stripHtmlForExcerpt(html: string, maxLen = 140): string {
  const plain = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 'Empty document';
  return plain.length > maxLen ? `${plain.slice(0, maxLen)}…` : plain;
}

const AVATAR_PALETTE = ['#4f46e5', '#059669', '#d97706', '#db2777', '#0284c7', '#7c3aed'];

export async function listUsers(customClient?: Client): Promise<User[]> {
  const db = await ensureDbReady(customClient);
  const res = await db.execute(
    'SELECT id, name, email, avatar_color, role_title FROM users ORDER BY created_at ASC'
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    avatarColor: String(r.avatar_color),
    roleTitle: String(r.role_title),
  }));
}

export async function getUserById(userId: string, customClient?: Client): Promise<User | null> {
  const db = await ensureDbReady(customClient);
  const res = await db.execute({
    sql: 'SELECT id, name, email, avatar_color, role_title FROM users WHERE id = ?',
    args: [userId],
  });
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    avatarColor: String(row.avatar_color),
    roleTitle: String(row.role_title),
  };
}

export async function findOrCreateUserByEmail(
  emailInput: string,
  nameInput?: string,
  customClient?: Client
): Promise<User> {
  const db = await ensureDbReady(customClient);
  const email = emailInput.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ServiceError('Please provide a valid email address.', 400);
  }

  const existing = await db.execute({
    sql: 'SELECT id, name, email, avatar_color, role_title FROM users WHERE lower(email) = ?',
    args: [email],
  });
  if (existing.rows[0]) {
    const r = existing.rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      email: String(r.email),
      avatarColor: String(r.avatar_color),
      roleTitle: String(r.role_title),
    };
  }

  const derivedName =
    nameInput?.trim() ||
    email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const id = `user-${randomUUID().slice(0, 8)}`;
  const avatarColor = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
  const roleTitle = 'Collaborator';
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO users (id, name, email, avatar_color, role_title, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, derivedName, email, avatarColor, roleTitle, now],
  });

  return {
    id,
    name: derivedName,
    email,
    avatarColor,
    roleTitle,
  };
}

export async function listAccessibleDocuments(
  userId: string,
  customClient?: Client
): Promise<DocumentSummary[]> {
  const db = await ensureDbReady(customClient);

  const res = await db.execute({
    sql: `
      SELECT
        d.id,
        d.title,
        d.content,
        d.owner_id,
        d.created_at,
        d.updated_at,
        u.name AS owner_name,
        u.email AS owner_email,
        u.avatar_color AS owner_avatar_color,
        ds.role AS shared_role,
        (SELECT COUNT(*) FROM document_shares s WHERE s.document_id = d.id) AS share_count,
        (SELECT COUNT(*) FROM document_attachments a WHERE a.document_id = d.id) AS attachment_count
      FROM documents d
      JOIN users u ON u.id = d.owner_id
      LEFT JOIN document_shares ds ON ds.document_id = d.id AND ds.user_id = ?
      WHERE d.owner_id = ? OR ds.user_id = ?
      ORDER BY d.updated_at DESC
    `,
    args: [userId, userId, userId],
  });

  return res.rows.map((r) => {
    const isOwner = String(r.owner_id) === userId;
    const accessRole: AccessRole = isOwner
      ? 'owner'
      : (String(r.shared_role) as ShareRole);

    return {
      id: String(r.id),
      title: String(r.title),
      excerpt: stripHtmlForExcerpt(String(r.content)),
      ownerId: String(r.owner_id),
      ownerName: String(r.owner_name),
      ownerEmail: String(r.owner_email),
      ownerAvatarColor: String(r.owner_avatar_color),
      accessRole,
      shareCount: Number(r.share_count ?? 0),
      attachmentCount: Number(r.attachment_count ?? 0),
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
    };
  });
}

export async function getDocumentWithAccess(
  documentId: string,
  userId: string,
  customClient?: Client
): Promise<DocumentDetail> {
  const db = await ensureDbReady(customClient);

  const docRes = await db.execute({
    sql: `
      SELECT
        d.id,
        d.title,
        d.content,
        d.owner_id,
        d.created_at,
        d.updated_at,
        u.name AS owner_name,
        u.email AS owner_email,
        u.avatar_color AS owner_avatar_color
      FROM documents d
      JOIN users u ON u.id = d.owner_id
      WHERE d.id = ?
    `,
    args: [documentId],
  });

  const docRow = docRes.rows[0];
  if (!docRow) {
    throw new ServiceError('Document not found.', 404);
  }

  const sharesRes = await db.execute({
    sql: `
      SELECT
        ds.id,
        ds.document_id,
        ds.user_id,
        ds.role,
        ds.created_at,
        u.name AS user_name,
        u.email AS user_email,
        u.avatar_color AS user_avatar_color
      FROM document_shares ds
      JOIN users u ON u.id = ds.user_id
      WHERE ds.document_id = ?
      ORDER BY ds.created_at ASC
    `,
    args: [documentId],
  });

  const shares: DocumentShare[] = sharesRes.rows.map((s) => ({
    id: String(s.id),
    documentId: String(s.document_id),
    userId: String(s.user_id),
    userName: String(s.user_name),
    userEmail: String(s.user_email),
    userAvatarColor: String(s.user_avatar_color),
    role: String(s.role) as ShareRole,
    createdAt: String(s.created_at),
  }));

  const isOwner = String(docRow.owner_id) === userId;
  const userShare = shares.find((s) => s.userId === userId);

  if (!isOwner && !userShare) {
    throw new ServiceError(
      'You do not have permission to view this document. Ask the document owner to share it with you.',
      403
    );
  }

  const accessRole: AccessRole = isOwner ? 'owner' : userShare!.role;

  const attachRes = await db.execute({
    sql: `
      SELECT
        a.id,
        a.document_id,
        a.file_name,
        a.file_type,
        a.file_size,
        a.extracted_html,
        a.uploaded_by_user_id,
        a.created_at,
        u.name AS uploaded_by_name
      FROM document_attachments a
      JOIN users u ON u.id = a.uploaded_by_user_id
      WHERE a.document_id = ?
      ORDER BY a.created_at DESC
    `,
    args: [documentId],
  });

  const attachments: DocumentAttachment[] = attachRes.rows.map((a) => ({
    id: String(a.id),
    documentId: String(a.document_id),
    fileName: String(a.file_name),
    fileType: String(a.file_type),
    fileSize: Number(a.file_size),
    extractedHtml: a.extracted_html ? String(a.extracted_html) : null,
    uploadedByUserId: String(a.uploaded_by_user_id),
    uploadedByName: String(a.uploaded_by_name),
    createdAt: String(a.created_at),
  }));

  return {
    id: String(docRow.id),
    title: String(docRow.title),
    content: String(docRow.content),
    ownerId: String(docRow.owner_id),
    ownerName: String(docRow.owner_name),
    ownerEmail: String(docRow.owner_email),
    ownerAvatarColor: String(docRow.owner_avatar_color),
    accessRole,
    shares,
    attachments,
    updatedAt: String(docRow.updated_at),
    createdAt: String(docRow.created_at),
  };
}

export async function createDocument(
  userId: string,
  input: { title?: string; content?: string },
  customClient?: Client
): Promise<DocumentDetail> {
  const db = await ensureDbReady(customClient);
  const user = await getUserById(userId, db);
  if (!user) {
    throw new ServiceError('Authenticated user not found.', 401);
  }

  const title = (input.title ?? 'Untitled Document').trim() || 'Untitled Document';
  if (title.length > 200) {
    throw new ServiceError('Document title cannot exceed 200 characters.', 400);
  }

  const content = input.content ?? '<p></p>';
  const id = `doc-${randomUUID().slice(0, 10)}`;
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, title, content, userId, now, now],
  });

  return getDocumentWithAccess(id, userId, db);
}

export async function updateDocument(
  documentId: string,
  userId: string,
  input: { title?: string; content?: string },
  customClient?: Client
): Promise<DocumentDetail> {
  const db = await ensureDbReady(customClient);
  const current = await getDocumentWithAccess(documentId, userId, db);

  if (current.accessRole === 'viewer') {
    throw new ServiceError(
      'View-only permission: You need Editor or Owner access to edit or rename this document.',
      403
    );
  }

  let nextTitle = current.title;
  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) {
      throw new ServiceError('Document title cannot be empty.', 400);
    }
    if (trimmed.length > 200) {
      throw new ServiceError('Document title cannot exceed 200 characters.', 400);
    }
    nextTitle = trimmed;
  }

  const nextContent = input.content !== undefined ? input.content : current.content;
  const now = new Date().toISOString();

  await db.execute({
    sql: `UPDATE documents SET title = ?, content = ?, updated_at = ? WHERE id = ?`,
    args: [nextTitle, nextContent, now, documentId],
  });

  return getDocumentWithAccess(documentId, userId, db);
}

export async function deleteDocument(
  documentId: string,
  userId: string,
  customClient?: Client
): Promise<void> {
  const db = await ensureDbReady(customClient);
  const current = await getDocumentWithAccess(documentId, userId, db);

  if (current.accessRole !== 'owner') {
    throw new ServiceError('Only the document owner can delete this document.', 403);
  }

  await db.execute({
    sql: 'DELETE FROM document_shares WHERE document_id = ?',
    args: [documentId],
  });
  await db.execute({
    sql: 'DELETE FROM document_attachments WHERE document_id = ?',
    args: [documentId],
  });
  await db.execute({
    sql: 'DELETE FROM documents WHERE id = ?',
    args: [documentId],
  });
}

export async function shareDocumentWithUser(
  documentId: string,
  actingUserId: string,
  targetEmail: string,
  role: ShareRole,
  customClient?: Client
): Promise<DocumentDetail> {
  const db = await ensureDbReady(customClient);
  const current = await getDocumentWithAccess(documentId, actingUserId, db);

  if (current.accessRole !== 'owner') {
    throw new ServiceError('Only the document owner can manage sharing permissions.', 403);
  }

  if (role !== 'editor' && role !== 'viewer') {
    throw new ServiceError('Invalid role. Role must be "editor" or "viewer".', 400);
  }

  const targetUser = await findOrCreateUserByEmail(targetEmail, undefined, db);

  if (targetUser.id === current.ownerId) {
    throw new ServiceError('Cannot share a document with its owner.', 400);
  }

  const now = new Date().toISOString();
  const existing = await db.execute({
    sql: 'SELECT id FROM document_shares WHERE document_id = ? AND user_id = ?',
    args: [documentId, targetUser.id],
  });

  if (existing.rows[0]) {
    await db.execute({
      sql: 'UPDATE document_shares SET role = ? WHERE id = ?',
      args: [role, String(existing.rows[0].id)],
    });
  } else {
    const shareId = `share-${randomUUID().slice(0, 10)}`;
    await db.execute({
      sql: `INSERT INTO document_shares (id, document_id, user_id, role, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [shareId, documentId, targetUser.id, role, now],
    });
  }

  return getDocumentWithAccess(documentId, actingUserId, db);
}

export async function removeDocumentShare(
  documentId: string,
  actingUserId: string,
  targetUserId: string,
  customClient?: Client
): Promise<DocumentDetail> {
  const db = await ensureDbReady(customClient);
  const current = await getDocumentWithAccess(documentId, actingUserId, db);

  if (current.accessRole !== 'owner') {
    throw new ServiceError('Only the document owner can revoke sharing access.', 403);
  }

  await db.execute({
    sql: 'DELETE FROM document_shares WHERE document_id = ? AND user_id = ?',
    args: [documentId, targetUserId],
  });

  return getDocumentWithAccess(documentId, actingUserId, db);
}

export async function addDocumentAttachment(
  documentId: string,
  actingUserId: string,
  attachmentInput: {
    fileName: string;
    fileType: string;
    fileSize: number;
    rawBase64: string;
    extractedHtml: string | null;
  },
  customClient?: Client
): Promise<DocumentDetail> {
  const db = await ensureDbReady(customClient);
  const current = await getDocumentWithAccess(documentId, actingUserId, db);

  if (current.accessRole === 'viewer') {
    throw new ServiceError(
      'View-only permission: You need Editor or Owner access to upload attachments.',
      403
    );
  }

  const id = `att-${randomUUID().slice(0, 10)}`;
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO document_attachments
          (id, document_id, file_name, file_type, file_size, raw_base64, extracted_html, uploaded_by_user_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      documentId,
      attachmentInput.fileName,
      attachmentInput.fileType,
      attachmentInput.fileSize,
      attachmentInput.rawBase64,
      attachmentInput.extractedHtml,
      actingUserId,
      now,
    ],
  });

  await db.execute({
    sql: 'UPDATE documents SET updated_at = ? WHERE id = ?',
    args: [now, documentId],
  });

  return getDocumentWithAccess(documentId, actingUserId, db);
}

export async function deleteDocumentAttachment(
  documentId: string,
  actingUserId: string,
  attachmentId: string,
  customClient?: Client
): Promise<DocumentDetail> {
  const db = await ensureDbReady(customClient);
  const current = await getDocumentWithAccess(documentId, actingUserId, db);

  if (current.accessRole === 'viewer') {
    throw new ServiceError('View-only permission: Cannot delete attachments.', 403);
  }

  await db.execute({
    sql: 'DELETE FROM document_attachments WHERE id = ? AND document_id = ?',
    args: [attachmentId, documentId],
  });

  return getDocumentWithAccess(documentId, actingUserId, db);
}
