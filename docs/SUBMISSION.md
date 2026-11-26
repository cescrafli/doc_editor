# Ajaia AI-Native Full Stack Developer Assignment — Submission

**Candidate:** Mochamad Rafli Mudji Prasetyo  
**Email:** `raflimudji@gmail.com`  
**Project Name:** **CESCTOR** — Lightweight Collaborative Document Workspace

---

## 1. Deliverables & Links Manifest

- **Google Drive Deliverables Folder:** https://drive.google.com/drive/folders/1eEbielSfShxKB3t93SyZ9gPzIApxmEvG?usp=sharing
- **Live Product Deployment URL (Vercel + Turso):** https://doc-editor-chi.vercel.app/
- **GitHub Repository:** https://github.com/cescrafli/doc_editor
- **Walkthrough Video URL (3–5 min YouTube):** https://youtu.be/kfsXUIBqLaE

### Files Included in Google Drive Folder & Repository
1. **Source Code** (`src/`, `tests/`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `docs/samples/sample-import.md`)
2. **`README.md`** — Local setup, project structure, supported file types, seeded test accounts, and Vercel + Turso deployment guide
3. **`docs/ARCHITECTURE.md`** — Architecture diagram, module boundaries, database schema, prioritization decisions, and scope tradeoffs
4. **`docs/AI_WORKFLOW.md`** — AI-Native workflow note detailing tools used, acceleration areas, modified/rejected AI outputs, and verification strategy
5. **`docs/SUBMISSION.md`** — Complete submission manifest and feature status summary
6. **`walkthrough_video_url.txt`** *(in Google Drive deliverables folder)* — Text file containing the walkthrough video link

---

## 2. Seeded Test Accounts (For Reviewing Sharing Flows)

No registration or external OAuth setup is required. Reviewers can test multi-user sharing immediately using the **Account Switcher** in the top-right header bar (or sign in with any custom email):

| Persona Name | Email | Pre-Seeded Document Roles |
| :--- | :--- | :--- |
| **Rafli Prasetyo** *(Default Active)* | `raflimudji@gmail.com` | **Owner** of *Welcome to Cesctor.md*, **Editor** on *Collaborative Editor UX Spec*, **Viewer** on *Security & Access Control Policy* |
| **Sarah Chen** | `sarah@ajaia.com` | **Owner** of *Collaborative Editor UX Spec*, **Editor** on *Welcome to Cesctor.md*, **Viewer** on *Security & Access Control Policy* |
| **Alex Rivera** | `alex@ajaia.com` | **Owner** of *Security & Access Control Policy*, **Viewer** on *Collaborative Editor UX Spec* |
| **Maya Patel** | `maya@ajaia.com` | **Viewer** on *Welcome to Cesctor.md* |

---

## 3. Feature Completion Status

### What Is Working End-to-End
- **Document Creation & Rich-Text Editing (`src/components/editor/`):**
  - Create blank documents, inline title renaming, auto-save (`1.2s` debounce) + manual **Save Session** button, split-pane live preview, Zen Mode, Night Mode, and delete owned documents.
  - Rich-text formatting powered by TipTap/ProseMirror: **Bold**, **Italic**, **Underline**, **Strikethrough**, **Headings (`H1`, `H2`, `H3`)**, **Normal Text**, **Bulleted Lists**, **Numbered Lists**, **Blockquotes**, **Code Blocks**, **Undo/Redo**, **Clear Formatting**, and live word/character counter.
  - Exports (`src/lib/utils/exporters.ts`): **Markdown (`.md`)**, **HTML / Styled HTML (`.html`)**, and **Print / Save as PDF**.
- **File Upload & Import (`src/lib/utils/file-parser.ts`, `src/components/modals/FileUploadModal.tsx`):**
  - **New Document from File:** Upload `.md`, `.txt`, `.docx` (Word), or `.html` (up to 2 MB) and convert directly into a new editable rich-text document.
  - **Import into Active Draft:** Append or replace content in the current editor from an uploaded file.
  - **Document Attachments:** Upload reference files (`.md`, `.txt`, `.docx`, `.html`, `.pdf`, `.png`, `.jpg`, `.csv`, `.json` up to 2 MB), download them, or click **"Insert"** on text/markdown/Word attachments.
- **Role-Based Sharing & Permissions (`src/lib/services/document.service.ts`, `src/components/modals/ShareModal.tsx`):**
  - Clear visual separation between **All**, **Owned**, and **Shared** documents in the left sidebar with explicit role badges (`Owner`, `Editor`, `Viewer`).
  - Stretch feature implemented: **Role-Based Access Control (`Owner`, `Editor`, `Viewer`)** enforced on both the frontend UI and backend REST endpoints (`403 Forbidden`).
- **Persistence (`src/lib/db/client.ts`, `src/lib/db/schema.ts`):**
  - Dual-mode persistence via `@libsql/client`: uses **Turso Cloud SQLite** in production on Vercel and automatically uses a local SQLite file (`file:./local.db`) locally.
- **Engineering Quality & Automated Testing (`tests/`):**
  - Strict TypeScript type-checking (`npm run typecheck`), input validation, XSS sanitization, and Vitest integration/unit test suites (`tests/document.service.test.ts`, `tests/file-parser.test.ts`).

### What Was Intentionally Deprioritized (Scope Cuts)
- **Real-Time Multi-Cursor WebSocket / CRDT Sync (Yjs/Liveblocks):** Intentionally scoped out in favor of deterministic REST auto-save + Turso persistence so the architecture stays self-contained and reliable on serverless hosting.
- **Password / OAuth Authentication Flows:** Replaced with a 1-click **Seeded Account Switcher + Custom Email Sign-In** so reviewers can evaluate multi-user permissions in seconds.
- **External Object Storage (S3/R2) for Large Binary Uploads:** Capped attachments at 2 MB and stored them in SQLite/Turso alongside extracted rich-text HTML so local and cloud setups require zero third-party storage credentials.

### What I Would Build Next with Another 2–4 Hours
1. **Document Version History & Point-in-Time Restore:** Store immutable snapshots in a `document_versions` table with a side-by-side diff drawer and 1-click Restore.
2. **Inline Anchored Comments & Suggestion Mode:** Add a TipTap mark extension allowing `Viewer` and `Editor` collaborators to open threaded comments on selected text.
3. **Real-Time Presence & Collaborative Cursors:** Integrate Yjs over WebSockets/PartyKit to broadcast active collaborator cursors across concurrent tabs.

---

## 4. Local Run Instructions

```bash
npm install
npm run typecheck
npm test
npm run dev
```
