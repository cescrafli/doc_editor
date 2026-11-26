# CESCTOR — Collaborative Document & Rich-Text Workspace

**Candidate:** Mochamad Rafli Mudji Prasetyo (`raflimudji@gmail.com`)  
**Assessment:** Ajaia LLC — AI-Native Full Stack Developer Assignment  
**Live Deployment:** [https://doc-editor-chi.vercel.app/](https://doc-editor-chi.vercel.app/)  
**Walkthrough Video:** [https://youtu.be/kfsXUIBqLaE](https://youtu.be/kfsXUIBqLaE)  
**Deliverables Folder:** [Google Drive](https://drive.google.com/drive/folders/1eEbielSfShxKB3t93SyZ9gPzIApxmEvG?usp=sharing)

---

## Overview

**CESCTOR** is a lightweight collaborative document editor combining a distraction-free split-pane workspace with rich-text formatting, multi-format file import, role-based sharing permissions (`Owner`, `Editor`, `Viewer`), and zero-config local/cloud SQLite persistence via **Turso (`@libsql/client`)**.

### Documentation
- **[Architecture & Prioritization Note](./docs/ARCHITECTURE.md)** — System design, database schema, RBAC enforcement, and deliberate scope cuts
- **[AI-Native Workflow Note](./docs/AI_WORKFLOW.md)** — AI tools used, acceleration areas, modified/rejected AI outputs, and verification strategy
- **[Submission Manifest](./docs/SUBMISSION.md)** — Deliverables checklist, feature status, and next-step roadmap

---

## Core Capabilities

1. **Document Creation & Rich-Text Editing**
   - Create blank documents, rename inline, auto-save (`1.2s` debounce) or manual **Save Session**, live split preview, Zen Mode, Night Mode, and delete owned documents.
   - TipTap / ProseMirror formatting toolbar: **Bold**, **Italic**, **Underline**, **Strikethrough**, **Headings (`H1`–`H3`)**, **Normal Paragraph**, **Bulleted & Numbered Lists**, **Blockquotes**, **Code Blocks**, **Undo/Redo**, **Clear Formatting**, and live word/character counts.
   - Export to **Markdown (`.md`)**, **HTML / Styled HTML (`.html`)**, or **PDF (Print)**.

2. **Multi-Mode File Upload (Max 2 MB)**
   - **New Document from File:** Converts `.md`, `.markdown`, `.txt`, `.docx`, or `.html` into a new editable rich-text document.
   - **Import into Active Draft:** Appends or replaces the active document's content from an uploaded file.
   - **Document Attachments:** Attaches reference files (`.md`, `.txt`, `.docx`, `.html`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.csv`, `.json`) for download or 1-click insertion into the editor.
   - Sample file available at [`docs/samples/sample-import.md`](./docs/samples/sample-import.md).

3. **Role-Based Sharing (`Owner`, `Editor`, `Viewer`)**
   - Sidebar filter tabs (`All`, `Owned`, `Shared`) and explicit role badges distinguish owned vs. shared documents.
   - Permissions are enforced both in the UI (locking the editor and showing a View-Only banner for `Viewer`) and at the domain/API layer (`403 Forbidden` on unauthorized mutations).

4. **Dual-Mode Persistence (Turso Cloud + Local SQLite)**
   - **Production (Vercel):** Connects to Turso Cloud SQLite via `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
   - **Local Development:** Automatically creates and seeds `./local.db` when environment variables are unset.

---

## Project Structure

```text
.
├── docs/
│   ├── ARCHITECTURE.md            # System architecture & scope tradeoffs
│   ├── AI_WORKFLOW.md             # AI-native engineering workflow note
│   ├── SUBMISSION.md              # Assessment submission manifest
│   └── samples/
│       └── sample-import.md       # Sample Markdown file for upload testing
├── src/
│   ├── app/
│   │   ├── api/                   # Next.js App Router REST endpoints
│   │   │   ├── documents/         # CRUD, shares, and attachment routes
│   │   │   ├── upload/parse/      # File-to-HTML conversion endpoint
│   │   │   └── users/             # Account listing & custom email sign-in
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── editor/                # RichTextEditor & EditorToolbar
│   │   ├── layout/                # Navbar, Sidebar, StatusFooter
│   │   ├── modals/                # ShareModal, FileUploadModal, SettingsDrawer, ShortcutsModal
│   │   └── workspace/             # WorkspaceApp, DocumentHeader, AttachmentsBar
│   ├── lib/
│   │   ├── api/http.ts            # Request user extraction & error responder
│   │   ├── db/                    # libSQL client factory & schema/seed bootstrap
│   │   ├── services/              # Core document CRUD & RBAC service layer
│   │   └── utils/                 # File parser/sanitizer & document exporters
│   └── types/index.ts             # Shared domain & API TypeScript types
└── tests/
    ├── document.service.test.ts   # CRUD, RBAC & attachment integration tests
    └── file-parser.test.ts        # Parsing, XSS sanitization & exporter unit tests
```

---

## Seeded Test Accounts

Use the **Account Switcher** in the top-right navbar (or the quick-switch bar in the footer) to test sharing roles without registration:

| Name | Email | Default Seeded Roles |
| :--- | :--- | :--- |
| **Rafli Prasetyo** *(Default)* | `raflimudji@gmail.com` | **Owner** of *Welcome to Cesctor.md*, **Editor** on *Collaborative Editor UX Spec*, **Viewer** on *Security & Access Control Policy* |
| **Sarah Chen** | `sarah@ajaia.com` | **Owner** of *Collaborative Editor UX Spec*, **Editor** on *Welcome to Cesctor.md*, **Viewer** on *Security & Access Control Policy* |
| **Alex Rivera** | `alex@ajaia.com` | **Owner** of *Security & Access Control Policy*, **Viewer** on *Collaborative Editor UX Spec* |
| **Maya Patel** | `maya@ajaia.com` | **Viewer** on *Welcome to Cesctor.md* |

---

## Local Setup & Scripts

### Prerequisites
- Node.js `v18.18+` (tested on `v24.x`)
- npm `v9+`

### Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). No `.env` file is required locally — `./local.db` is created and seeded automatically.

### Verification Commands
```bash
npm run typecheck   # Strict TypeScript check (tsc --noEmit)
npm test            # Vitest unit & in-memory SQLite integration suite
npm run build       # Production Next.js build
```

---

## Deploying to Vercel + Turso

1. Import `https://github.com/cescrafli/doc_editor.git` into **Vercel**.
2. Configure environment variables:
   - `TURSO_DATABASE_URL`: `libsql://doceditor-cescrafli.aws-ap-southeast-1.turso.io`
   - `TURSO_AUTH_TOKEN`: `<your-turso-auth-token>`
3. Deploy — schema creation and initial seeding run automatically on first request.
