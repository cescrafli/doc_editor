import { describe, it, expect, beforeEach } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { initializeSchemaAndSeed } from '@/lib/db';
import {
  createDocument,
  deleteDocument,
  getDocumentWithAccess,
  listAccessibleDocuments,
  listUsers,
  removeDocumentShare,
  shareDocumentWithUser,
  updateDocument,
  addDocumentAttachment,
} from '@/lib/document-service';
import {
  FileValidationError,
  MAX_FILE_SIZE_BYTES,
  parseFileToHtml,
} from '@/lib/file-parser';

describe('Ajaia Docs — Core Document Service, RBAC & File Upload Suite', () => {
  let db: Client;

  beforeEach(async () => {
    db = createClient({ url: 'file::memory:' });
    await initializeSchemaAndSeed(db);
  });

  it('seeds initial team accounts and sample shared documents', async () => {
    const users = await listUsers(db);
    expect(users.length).toBeGreaterThanOrEqual(4);

    const rafliDocs = await listAccessibleDocuments('user-rafli', db);
    // Rafli owns 1 seeded doc and has 2 shared with him (1 as editor, 1 as viewer)
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

    // 1. Unshared user (Maya) cannot read or edit
    await expect(getDocumentWithAccess(doc.id, 'user-maya', db)).rejects.toThrow(
      /do not have permission/i
    );

    // 2. Owner shares with Maya as VIEWER and Sarah as EDITOR
    await shareDocumentWithUser(doc.id, 'user-rafli', 'maya@ajaia.com', 'viewer', db);
    await shareDocumentWithUser(doc.id, 'user-rafli', 'sarah@ajaia.com', 'editor', db);

    // 3. Viewer (Maya) can read the document with accessRole === 'viewer'
    const mayaView = await getDocumentWithAccess(doc.id, 'user-maya', db);
    expect(mayaView.accessRole).toBe('viewer');

    // 4. Viewer (Maya) is blocked from editing content, renaming, or uploading attachments
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
          fileSize: 12,
          rawBase64: Buffer.from('hello').toString('base64'),
          extractedHtml: '<p>hello</p>',
        },
        db
      )
    ).rejects.toThrow(/View-only permission/i);

    // 5. Editor (Sarah) CAN update content and title
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

    // 6. Editor (Sarah) CANNOT delete the document or modify sharing permissions
    await expect(deleteDocument(doc.id, 'user-sarah', db)).rejects.toThrow(
      /Only the document owner/i
    );
    await expect(
      shareDocumentWithUser(doc.id, 'user-sarah', 'alex@ajaia.com', 'editor', db)
    ).rejects.toThrow(/Only the document owner/i);

    // 7. Owner can revoke access and delete document
    const afterRevoke = await removeDocumentShare(doc.id, 'user-rafli', 'user-maya', db);
    expect(afterRevoke.shares.some((s) => s.userId === 'user-maya')).toBe(false);

    await deleteDocument(doc.id, 'user-rafli', db);
    await expect(getDocumentWithAccess(doc.id, 'user-rafli', db)).rejects.toThrow(/not found/i);
  });

  it('parses Markdown (.md) and Plain Text (.txt) uploads into sanitized rich-text HTML', async () => {
    const mdContent = `# Product Spec\n\nHere is **bold** and *italic* text.\n\n- Item A\n- Item B`;
    const mdBuffer = Buffer.from(mdContent, 'utf-8');

    const parsedMd = await parseFileToHtml('product-spec_v1.md', mdBuffer.length, mdBuffer);
    expect(parsedMd.suggestedTitle).toBe('product spec v1');
    expect(parsedMd.htmlContent).toContain('<h1>Product Spec</h1>');
    expect(parsedMd.htmlContent).toContain('<strong>bold</strong>');
    expect(parsedMd.htmlContent).toContain('<li>Item A</li>');

    const txtContent = `First paragraph\nwith line break\n\nSecond paragraph <script>alert(1)</script>`;
    const txtBuffer = Buffer.from(txtContent, 'utf-8');
    const parsedTxt = await parseFileToHtml('meeting-notes.txt', txtBuffer.length, txtBuffer);
    expect(parsedTxt.htmlContent).toContain('<p>First paragraph<br />with line break</p>');
    expect(parsedTxt.htmlContent).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('rejects unsupported file types and oversized uploads', async () => {
    const dummy = Buffer.from('binary-content', 'utf-8');
    await expect(parseFileToHtml('malware.exe', dummy.length, dummy)).rejects.toThrow(
      FileValidationError
    );

    await expect(
      parseFileToHtml('huge.txt', MAX_FILE_SIZE_BYTES + 100, dummy)
    ).rejects.toThrow(/exceeds maximum size limit/i);
  });
});
