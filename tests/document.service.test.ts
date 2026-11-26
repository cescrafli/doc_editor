import { describe, it, expect, beforeEach } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { initializeSchemaAndSeed } from '@/lib/db/schema';
import {
  addDocumentAttachment,
  createDocument,
  deleteDocument,
  getAttachmentBinary,
  getDocumentWithAccess,
  listAccessibleDocuments,
  listUsers,
  removeDocumentShare,
  shareDocumentWithUser,
  updateDocument,
} from '@/lib/services/document.service';

describe('Document Service — CRUD, RBAC & Attachments Integration', () => {
  let db: Client;

  beforeEach(async () => {
    db = createClient({ url: 'file::memory:' });
    await initializeSchemaAndSeed(db);
  });

  it('seeds initial team accounts and sample owned/shared documents', async () => {
    const users = await listUsers(db);
    expect(users.length).toBeGreaterThanOrEqual(4);

    const rafliDocs = await listAccessibleDocuments('user-rafli', db);
    const owned = rafliDocs.filter((d) => d.accessRole === 'owner');
    const sharedAsEditor = rafliDocs.filter((d) => d.accessRole === 'editor');
    const sharedAsViewer = rafliDocs.filter((d) => d.accessRole === 'viewer');

    expect(owned.length).toBe(1);
    expect(sharedAsEditor.length).toBe(1);
    expect(sharedAsViewer.length).toBe(1);
  });

  it('allows creating, renaming, and updating rich-text document content', async () => {
    const created = await createDocument(
      'user-rafli',
      {
        title: 'Sprint Retrospective Notes',
        content: '<h1>Retro</h1><p>Initial <strong>draft</strong></p>',
      },
      db
    );

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Sprint Retrospective Notes');
    expect(created.accessRole).toBe('owner');

    const updated = await updateDocument(
      created.id,
      'user-rafli',
      {
        title: 'Sprint 14 Retrospective Notes',
        content: '<h1>Retro</h1><ul><li>Shipped role-based sharing</li></ul>',
      },
      db
    );

    expect(updated.title).toBe('Sprint 14 Retrospective Notes');
    expect(updated.content).toContain('<ul><li>Shipped role-based sharing</li></ul>');
  });

  it('enforces Role-Based Access Control (Owner vs Editor vs Viewer vs Unauthorized)', async () => {
    const doc = await createDocument(
      'user-rafli',
      {
        title: 'Confidential Architecture Proposal',
        content: '<p>Top secret design</p>',
      },
      db
    );

    await expect(getDocumentWithAccess(doc.id, 'user-maya', db)).rejects.toThrow(
      /do not have permission/i
    );

    await shareDocumentWithUser(doc.id, 'user-rafli', 'maya@ajaia.com', 'viewer', db);
    await shareDocumentWithUser(doc.id, 'user-rafli', 'sarah@ajaia.com', 'editor', db);

    const mayaView = await getDocumentWithAccess(doc.id, 'user-maya', db);
    expect(mayaView.accessRole).toBe('viewer');

    await expect(
      updateDocument(doc.id, 'user-maya', { content: '<p>Tampered</p>' }, db)
    ).rejects.toThrow(/View-only permission/i);

    await expect(
      addDocumentAttachment(
        doc.id,
        'user-maya',
        {
          fileName: 'notes.txt',
          fileType: 'TXT',
          fileSize: 5,
          rawBase64: Buffer.from('hello').toString('base64'),
          extractedHtml: '<p>hello</p>',
        },
        db
      )
    ).rejects.toThrow(/View-only permission/i);

    const sarahUpdated = await updateDocument(
      doc.id,
      'user-sarah',
      {
        title: 'Confidential Architecture Proposal (Reviewed)',
        content: '<p>Updated by Sarah as Editor</p>',
      },
      db
    );
    expect(sarahUpdated.title).toBe('Confidential Architecture Proposal (Reviewed)');
    expect(sarahUpdated.accessRole).toBe('editor');

    await expect(deleteDocument(doc.id, 'user-sarah', db)).rejects.toThrow(
      /Only the document owner/i
    );
    await expect(
      shareDocumentWithUser(doc.id, 'user-sarah', 'alex@ajaia.com', 'editor', db)
    ).rejects.toThrow(/Only the document owner/i);

    const withAttachment = await addDocumentAttachment(
      doc.id,
      'user-sarah',
      {
        fileName: 'brief.txt',
        fileType: 'TXT',
        fileSize: 11,
        rawBase64: Buffer.from('hello world').toString('base64'),
        extractedHtml: '<p>hello world</p>',
      },
      db
    );
    expect(withAttachment.attachments.length).toBe(1);

    const downloaded = await getAttachmentBinary(
      doc.id,
      'user-maya',
      withAttachment.attachments[0].id,
      db
    );
    expect(downloaded.fileName).toBe('brief.txt');
    expect(downloaded.buffer.toString('utf-8')).toBe('hello world');

    const afterRevoke = await removeDocumentShare(doc.id, 'user-rafli', 'user-maya', db);
    expect(afterRevoke.shares.some((s) => s.userId === 'user-maya')).toBe(false);

    await deleteDocument(doc.id, 'user-rafli', db);
    await expect(getDocumentWithAccess(doc.id, 'user-rafli', db)).rejects.toThrow(/not found/i);
  });
});
