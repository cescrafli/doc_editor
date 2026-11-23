# Ajaia Docs — Lightweight Collaborative Document Editor

**Candidate:** Mochamad Rafli Mudji Prasetyo (`raflimudji@gmail.com`)  
**Role:** AI-Native Full Stack Developer Assessment — Ajaia LLC  
**Live Deployment URL:** [https://doc-editor-chi.vercel.app/](https://doc-editor-chi.vercel.app/)  
**Google Drive Deliverables Folder:** [https://drive.google.com/drive/folders/1eEbielSfShxKB3t93SyZ9gPzIApxmEvG?usp=sharing](https://drive.google.com/drive/folders/1eEbielSfShxKB3t93SyZ9gPzIApxmEvG?usp=sharing)

Ajaia Docs is a full-stack collaborative document workspace inspired by Google Docs, engineered with **Next.js 14 (App Router)**, **TypeScript**, **TipTap (ProseMirror)**, **Tailwind CSS**, and **Turso (`@libsql/client` / SQLite)**.

---

## 1. Core Capabilities Implemented

1. **Document Creation & Rich-Text Editing**
   - Create blank documents, rename documents inline, edit rich-text content in the browser, auto-save (1.2s debounce) + manual **Save** button, and delete owned documents.
   - Rich-text toolbar supporting: **Bold**, **Italic**, **Underline**, **Strikethrough**, **Headings (H1, H2, H3)**, **Normal Paragraph**, **Bulleted Lists**, **Numbered Lists**, **Blockquotes**, **Code Blocks**, **Undo/Redo**, **Clear Formatting**, and live word/character counts.
   - Export documents to **Markdown (`.md`)** or **PDF / Print** via clean print stylesheets.

2. **File Upload (3 Product-Relevant Workflows)**
   - **Workflow A — Turn File into a New Editable Document:** Upload a `.md`, `.txt`, `.docx`, or `.html` file from the header bar to automatically convert and open it as a new rich-text document.
   - **Workflow B — Import File Content into Current Draft:** Append or replace the active document's content from an uploaded `.md`, `.txt`, `.docx`, or `.html` file.
   - **Workflow C — Document Attachments:** Upload reference files (`.md`, `.txt`, `.docx`, `.html`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.csv`, `.json` up to **2 MB**) attached to a document, download them, or click **"Insert into Doc"** on text/markdown/Word attachments.

3. **Role-Based Sharing & Access Control (Core + Stretch Goal)**
   - Every document has an explicit **Owner** and supports sharing with collaborators under two distinct roles:
     - **Editor (`editor`):** Can edit document content, rename the document, and import/upload files. Cannot delete the document or modify sharing permissions.
     - **Viewer (`viewer`):** Read-only access. The editor canvas is locked (`editable: false`), a View-Only banner is displayed, and all write API endpoints enforce `403 Forbidden`.
   - Clear visual distinction in the sidebar with dedicated filter tabs (`All`, `Owned`, `Shared`) and role badges (`Owner`, `Shared • Editor`, `Shared • Viewer`).

4. **Zero-Config Local & Cloud Persistence (Turso / libSQL + SQLite)**
   - Uses `@libsql/client` for seamless dual-mode persistence:
     - **Local Development:** Automatically persists to a local SQLite database file (`file:./local.db`) with zero external setup required.
     - **Production (Vercel + Turso):** Connects to Turso Cloud SQLite via `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
     - **Serverless Fallback:** If deployed to Vercel before `TURSO_DATABASE_URL` is configured, automatically falls back to `file:/tmp/ajaia-docs.db` and seeds default users/documents so the live preview never crashes.

---

## 2. Seeded Test Accounts (For Reviewing Sharing Flows)

No registration or external OAuth is required to test multi-user sharing. Use the **Account Switcher** in the top-right navigation bar to switch between four seeded users in one click (or sign in with any custom email):

| Name | Email | Default Seeded Documents & Roles |
| :--- | :--- | :--- |
| **Rafli Prasetyo** *(Default)* | `raflimudji@gmail.com` | **Owner** of *Ajaia Q4 Product Roadmap*, **Editor** on *Collaborative Editor UX Spec*, **Viewer** on *Security & Access Control Policy* |
| **Sarah Chen** | `sarah@ajaia.com` | **Owner** of *Collaborative Editor UX Spec*, **Editor** on *Ajaia Q4 Product Roadmap*, **Viewer** on *Security & Access Control Policy* |
| **Alex Rivera** | `alex@ajaia.com` | **Owner** of *Security & Access Control Policy*, **Viewer** on *Collaborative Editor UX Spec* |
| **Maya Patel** | `maya@ajaia.com` | **Viewer** on *Ajaia Q4 Product Roadmap* |

---

## 3. Supported File Types & Limits

- **Maximum File Size:** `2 MB` per file (enforced on both client and server).
- **Rich-Text Import & Conversion Formats:** `.md`, `.markdown`, `.txt`, `.docx` (Word), `.html`, `.htm`.
- **Document Attachment Formats:** `.md`, `.markdown`, `.txt`, `.docx`, `.html`, `.htm`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.csv`, `.json`.
- A sample Markdown file is included at [`samples/sample-import.md`](./samples/sample-import.md) for quick upload testing.

---

## 4. Local Setup & Run Instructions

### Prerequisites
- **Node.js** v18.18+ or v20+ (tested on Node v24)
- **npm** v9+

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
*(Note: No `.env` file is required for local development. The app automatically creates and seeds `./local.db` on startup.)*

### Step 3: Run Automated Tests
```bash
npm test
```
Runs the Vitest integration suite (`src/__tests__/document-service.test.ts`) against an isolated in-memory SQLite instance (`file::memory:`), verifying document CRUD, Role-Based Access Control (`Owner` vs `Editor` vs `Viewer` vs `Unauthorized`), and file upload parsing/validation.

### Step 4: Production Build Verification
```bash
npm run build
npm start
```

---

## 5. Deploying to Vercel + Turso

1. Create a free database on [Turso](https://turso.tech) (or via `turso db create ajaia-docs`).
2. Copy the database URL (`libsql://...`) and auth token (`turso db tokens create ajaia-docs`).
3. Deploy this repository (`https://github.com/cescrafli/doc_editor.git`) to **Vercel** and configure two environment variables:
   - `TURSO_DATABASE_URL`: `libsql://doceditor-cescrafli.aws-ap-southeast-1.turso.io`
   - `TURSO_AUTH_TOKEN`: `your-turso-auth-token`
4. On the first request, `initializeSchemaAndSeed()` automatically creates the schema and seeds the 4 test users and 3 sample documents.
