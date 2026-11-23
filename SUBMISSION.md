# Ajaia AI-Native Full Stack Developer Assignment — Submission

**Candidate:** Mochamad Rafli Mudji Prasetyo  
**Email:** `raflimudji@gmail.com`  
**Project Name:** **CESCTOR** — Lightweight Collaborative Document Workspace

---

## 1. Deliverables & Links Manifest

- **Google Drive Deliverables Folder:** https://drive.google.com/drive/folders/1eEbielSfShxKB3t93SyZ9gPzIApxmEvG?usp=sharing
- **Live Product Deployment URL (Vercel + Turso):** https://doc-editor-chi.vercel.app/
- **GitHub Repository:** https://github.com/cescrafli/doc_editor
- **Walkthrough Video URL (3–5 min Loom / YouTube):** `[PASTE_YOUR_WALKTHROUGH_VIDEO_URL_HERE]`

### Files Included in Google Drive Folder & Repository
1. **Source Code** (`src/`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `samples/sample-import.md`)
2. **`README.md`** — Local setup, supported file types, seeded test accounts, and Vercel + Turso deployment guide
3. **`ARCHITECTURE.md`** — Architecture diagram, database schema, prioritization decisions, and scope tradeoffs
4. **`AI_WORKFLOW.md`** — AI-Native workflow note detailing tools used, acceleration areas, modified/rejected AI outputs, and verification strategy
5. **`SUBMISSION.md`** — Complete submission manifest and feature status summary
6. **`walkthrough_video_url.txt`** — Text file containing the walkthrough video link

---

## 2. Seeded Test Accounts (For Reviewing Sharing Flows)

No registration or external OAuth setup is required. Reviewers can test multi-user sharing immediately using the **Account Switcher** in the top-right header bar (or sign in with any custom email):

| Persona Name | Email | Pre-Seeded Document Roles |
| :--- | :--- | :--- |
| **Rafli Prasetyo** *(Default Active)* | `raflimudji@gmail.com` | **Owner** of *Ajaia Q4 Product Roadmap*, **Editor** on *Collaborative Editor UX Spec*, **Viewer** on *Security & Access Control Policy* |
| **Sarah Chen** | `sarah@ajaia.com` | **Owner** of *Collaborative Editor UX Spec*, **Editor** on *Ajaia Q4 Product Roadmap*, **Viewer** on *Security & Access Control Policy* |
| **Alex Rivera** | `alex@ajaia.com` | **Owner** of *Security & Access Control Policy*, **Viewer** on *Collaborative Editor UX Spec* |
| **Maya Patel** | `maya@ajaia.com` | **Viewer** on *Ajaia Q4 Product Roadmap* |

---

## 3. Feature Completion Status

### What Is Working End-to-End
- **Document Creation & Rich-Text Editing (`src/components/RichTextEditor.tsx`):**
  - Create blank documents, inline title renaming, auto-save (1.2s debounce) + manual **Save** button, and delete owned documents.
  - Rich-text formatting powered by TipTap/ProseMirror: **Bold**, **Italic**, **Underline**, **Strikethrough**, **Headings (`H1`, `H2`, `H3`)**, **Normal Text**, **Bulleted Lists**, **Numbered Lists**, **Blockquotes**, **Code Blocks**, **Undo/Redo**, **Clear Formatting**, and live word/character counter.
  - Bonus exports: **Export to Markdown (`.md`)** and **Print / Save as PDF** with print-optimized CSS.
- **File Upload & Import (`src/lib/file-parser.ts`, `src/components/FileUploadModal.tsx`):**
  - **New Document from File:** Upload `.md`, `.txt`, `.docx` (Word), or `.html` (up to 2 MB) and convert directly into a new editable rich-text document.
  - **Import into Active Draft:** Append or replace content in the current editor from an uploaded `.md`, `.txt`, `.docx`, or `.html` file.
  - **Document Attachments:** Upload reference files (`.md`, `.txt`, `.docx`, `.html`, `.pdf`, `.png`, `.jpg`, `.csv`, `.json` up to 2 MB) to a document, download them, or click **"Insert into Doc"** on text/markdown/Word attachments.
- **Role-Based Sharing & Permissions (`src/lib/document-service.ts`, `src/components/ShareModal.tsx`):**
  - Clear visual separation between **All**, **Owned**, and **Shared** documents in the left sidebar with explicit role badges (`Owner`, `Shared • Editor`, `Shared • Viewer`).
  - Stretch feature implemented: **Role-Based Access Control (`Owner`, `Editor`, `Viewer`)** enforced on both the frontend UI (locking the editor and showing a View-Only banner for Viewers) and backend REST endpoints (`403 Forbidden` when a Viewer attempts to edit/upload or an Editor attempts to delete/manage shares).
- **Persistence (`src/lib/db.ts`):**
  - Dual-mode persistence via `@libsql/client`: uses **Turso Cloud SQLite** in production on Vercel and automatically uses a local SQLite file (`file:./local.db`) in local development with zero external configuration.
- **Engineering Quality & Automated Testing (`src/__tests__/document-service.test.ts`):**
  - Input validation, file size/type guards, HTML sanitization against XSS, and 5 automated Vitest integration test suites running against an isolated in-memory SQLite instance (`file::memory:`).

### What Was Intentionally Deprioritized (Scope Cuts)
- **Real-Time Multi-Cursor WebSocket / CRDT Sync (Yjs/Liveblocks):** Intentionally scoped out in favor of deterministic REST auto-save + Turso persistence so the architecture stays self-contained and reliable on serverless hosting without requiring a separate stateful WebSocket cluster.
- **Password / OAuth Authentication Flows:** Replaced with a 1-click **Seeded Account Switcher + Custom Email Sign-In** so reviewers can evaluate multi-user `Owner`, `Editor`, and `Viewer` sharing permissions in seconds without inbox verification barriers.
- **External Object Storage (S3/R2) for Large Binary Uploads:** Capped attachments at 2 MB and stored them in SQLite/Turso alongside extracted rich-text HTML so local and cloud setups require zero third-party storage credentials.

### What I Would Build Next with Another 2–4 Hours
1. **Document Version History & Point-in-Time Restore:** Store immutable snapshots in a `document_versions` table whenever a user clicks manual Save or imports a file, with a side-by-side diff drawer and 1-click Restore.
2. **Inline Anchored Comments & Suggestion Mode:** Add a custom TipTap mark extension allowing `Viewer` and `Editor` collaborators to highlight text ranges and open threaded comment discussions.
3. **Real-Time Presence & Collaborative Cursors:** Integrate Yjs with PartyKit or Supabase Realtime channels to broadcast active collaborator cursors and live edits across concurrent tabs.

---

## 4. Architecture & Technical Decisions Summary

- **Frontend & Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS, TipTap (ProseMirror), Lucide Icons.
- **Backend & Service Layer:** Next.js Route Handlers (`/api/documents`, `/api/documents/[id]`, `/api/documents/[id]/shares`, `/api/documents/[id]/attachments`, `/api/upload/parse`, `/api/users`) backed by a pure TypeScript domain service (`src/lib/document-service.ts`).
- **Database:** `@libsql/client` (Turso Cloud SQLite in production, `file:./local.db` locally, `file::memory:` in Vitest).
- **File Parsing:** `marked` for Markdown-to-HTML, `mammoth` for `.docx`-to-HTML, custom paragraph parser with XSS entity escaping for `.txt`, and HTML tag/attribute sanitizer for `.html`.

---

## 5. AI-Native Workflow Summary

- **Tools Used:** Antigravity (AI Coding Agent & Full-Stack Co-Engineer).
- **Where AI Materially Sped Up Execution:**
  - Designing the tri-environment `@libsql/client` database adapter (Turso prod + local file dev + in-memory test).
  - Building the multi-format file import parser (`.md`, `.txt`, `.docx`, `.html` -> sanitized ProseMirror HTML).
  - Scaffolding the TipTap formatting toolbar, role-based `ShareModal`, and Vitest RBAC integration tests.
- **What AI Output Was Changed or Rejected:**
  1. **Upgraded Vulnerable Next.js Version:** Caught a security deprecation warning on `next@14.2.25` (`CVE-2025-55182`, which Vercel blocks during deployment) and upgraded to the patched `next@14.2.35`.
  2. **Chose `@libsql/client` Over `better-sqlite3`:** Rejected native C++ `better-sqlite3` bindings to avoid Windows node-gyp issues and Vercel ephemeral filesystem limitations.
  3. **Enforced Server-Side RBAC:** Ensured `Owner`, `Editor`, and `Viewer` permissions are strictly validated in `src/lib/document-service.ts` rather than relying on UI-only button hiding.
  4. **Hardened File Imports Against XSS:** Added `escapeHtml` and `sanitizeImportedHtml` before loading imported file content into the rich-text editor, verified by an automated test case.

---

## 6. Local Run Instructions

```bash
npm install
npm test        # Runs 5 Vitest integration test suites against in-memory SQLite
npm run dev     # Starts local server at http://localhost:3000 (auto-creates & seeds ./local.db)
```
