import { createClient, type Client } from '@libsql/client';

let singletonClient: Client | null = null;
let initPromise: Promise<void> | null = null;

export function getDbClient(): Client {
  if (singletonClient) {
    return singletonClient;
  }

  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const tursoUrl =
    process.env.TURSO_DATABASE_URL?.trim() ||
    (tursoToken ? 'libsql://doceditor-cescrafli.aws-ap-southeast-1.turso.io' : undefined);

  if (tursoUrl) {
    singletonClient = createClient({
      url: tursoUrl,
      authToken: tursoToken || undefined,
    });
  } else if (process.env.VERCEL) {
    // Fallback on Vercel serverless if TURSO_DATABASE_URL is not yet configured
    singletonClient = createClient({
      url: 'file:/tmp/ajaia-docs.db',
    });
  } else {
    singletonClient = createClient({
      url: 'file:./local.db',
    });
  }

  return singletonClient;
}

export async function initializeSchemaAndSeed(client: Client): Promise<void> {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar_color TEXT NOT NULL,
      role_title TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS document_shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('editor', 'viewer')),
      created_at TEXT NOT NULL,
      UNIQUE(document_id, user_id),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_attachments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      raw_base64 TEXT NOT NULL,
      extracted_html TEXT,
      uploaded_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
    );
  `);

  const existingUsers = await client.execute('SELECT COUNT(*) as count FROM users');
  const count = Number(existingUsers.rows[0]?.count ?? 0);

  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();

  const seededUsers = [
    {
      id: 'user-rafli',
      name: 'Rafli Prasetyo',
      email: 'raflimudji@gmail.com',
      avatarColor: '#4f46e5',
      roleTitle: 'AI-Native Full Stack Engineer',
    },
    {
      id: 'user-sarah',
      name: 'Sarah Chen',
      email: 'sarah@ajaia.com',
      avatarColor: '#059669',
      roleTitle: 'Engineering Lead',
    },
    {
      id: 'user-alex',
      name: 'Alex Rivera',
      email: 'alex@ajaia.com',
      avatarColor: '#d97706',
      roleTitle: 'Product Designer',
    },
    {
      id: 'user-maya',
      name: 'Maya Patel',
      email: 'maya@ajaia.com',
      avatarColor: '#db2777',
      roleTitle: 'External Reviewer',
    },
  ];

  for (const u of seededUsers) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, avatar_color, role_title, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [u.id, u.name, u.email, u.avatarColor, u.roleTitle, now],
    });
  }

  const seededDocs = [
    {
      id: 'doc-roadmap-q4',
      title: 'Welcome to Cesctor.md',
      ownerId: 'user-rafli',
      content: `<h1>Welcome to Cesctor</h1><p>A clean, distraction-free collaborative document editor. Type on the left, see the rendered output on the right.</p><h2>Text Formatting</h2><p>Cesctor makes it easy to format text. You can write in <strong>bold</strong>, <em>italic</em>, <u>underline</u>, or <s>strikethrough</s>. Combine them for <strong><em>bold italic</em></strong> text. Use <code>inline code</code> for technical terms.</p><h2>Lists</h2><p>Unordered lists use dashes, asterisks, or toolbar controls:</p><ul><li>Import files from <strong>.md</strong>, <strong>.txt</strong>, <strong>.docx</strong>, or <strong>.html</strong> directly into editable documents</li><li>Share documents with teammates using <strong>Role-Based Permissions</strong> (<u>Owner</u>, <u>Editor</u>, <u>Viewer</u>)</li><li>Export to Markdown, HTML, or PDF</li></ul><p>Ordered lists are numbered automatically:</p><ol><li>Write and format your document in the left editor pane</li><li>Preview the rendered output live in the right pane</li><li>Share or persist changes automatically to Turso Cloud SQLite</li></ol><blockquote><p>Tip: Use the top-right Account Switcher (or bottom quick-switch bar) to test <strong>Owner</strong>, <strong>Editor</strong>, and <strong>Viewer (Read-Only)</strong> roles live!</p></blockquote>`,
    },
    {
      id: 'doc-ux-spec',
      title: 'Collaborative Editor UX & Sharing Specification',
      ownerId: 'user-sarah',
      content: `<h1>Collaborative Editor UX &amp; Sharing Specification</h1><p>This document is owned by <strong>Sarah Chen</strong> and shared with <strong>Rafli Prasetyo</strong> as an <u>Editor</u>, and with <strong>Alex Rivera</strong> as a <u>Viewer</u>.</p><h2>Key User Flows</h2><ul><li><strong>Inline Renaming:</strong> Click the title bar at the top of any editable document to rename it immediately.</li><li><strong>Rich Formatting:</strong> Use the toolbar for <strong>Bold</strong>, <em>Italic</em>, <u>Underline</u>, Headings (H1–H3), and bulleted or numbered lists.</li><li><strong>File Import &amp; Attachments:</strong> Import Markdown, Plain Text, or Word (.docx) files into a new document or append them into your active draft.</li></ul>`,
    },
    {
      id: 'doc-security-policy',
      title: 'Security & Access Control Policy (Read-Only Reference)',
      ownerId: 'user-alex',
      content: `<h1>Security &amp; Access Control Policy</h1><p>This document is owned by <strong>Alex Rivera</strong> and shared with <strong>Rafli Prasetyo</strong> and <strong>Sarah Chen</strong> with <strong>Viewer (Read-Only)</strong> permissions.</p><h2>Permission Matrix</h2><ul><li><strong>Owner:</strong> Full edit rights, rename document, manage sharing roles, upload attachments, and delete document.</li><li><strong>Editor:</strong> Edit document content, rename document, and upload/import files. Cannot delete the document or modify sharing permissions.</li><li><strong>Viewer:</strong> Read-only access to document content and attachments. Editor toolbar is locked and API write endpoints return <em>403 Forbidden</em>.</li></ul>`,
    },
  ];

  for (const d of seededDocs) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO documents (id, title, content, owner_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [d.id, d.title, d.content, d.ownerId, now, now],
    });
  }

  const seededShares = [
    { id: 'share-1', docId: 'doc-roadmap-q4', userId: 'user-sarah', role: 'editor' },
    { id: 'share-2', docId: 'doc-roadmap-q4', userId: 'user-maya', role: 'viewer' },
    { id: 'share-3', docId: 'doc-ux-spec', userId: 'user-rafli', role: 'editor' },
    { id: 'share-4', docId: 'doc-ux-spec', userId: 'user-alex', role: 'viewer' },
    { id: 'share-5', docId: 'doc-security-policy', userId: 'user-rafli', role: 'viewer' },
    { id: 'share-6', docId: 'doc-security-policy', userId: 'user-sarah', role: 'viewer' },
  ];

  for (const s of seededShares) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO document_shares (id, document_id, user_id, role, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [s.id, s.docId, s.userId, s.role, now],
    });
  }
}

export async function ensureDbReady(customClient?: Client): Promise<Client> {
  if (customClient) {
    return customClient;
  }
  const client = getDbClient();
  if (!initPromise) {
    initPromise = initializeSchemaAndSeed(client).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
  return client;
}
