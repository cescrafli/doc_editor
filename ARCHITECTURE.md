# Architecture & Prioritization Note — Ajaia Docs

**Candidate:** Mochamad Rafli Mudji Prasetyo (`raflimudji@gmail.com`)

---

## 1. Product Philosophy & What We Prioritized

Under a 4-hour delivery constraint, the highest risk in building a Google Docs-inspired product is spreading effort too thinly across complex infrastructure (e.g., custom OAuth, CRDT WebSockets, custom cloud bucket pipelines) at the expense of core product coherence.

I prioritized **depth, reliability, and zero-friction reviewer testability** across four pillars:

1. **Coherent Rich-Text Editing & Persistence:**
   - Built on **TipTap (ProseMirror)** so formatting commands (Bold, Italic, Underline, Strikethrough, H1–H3 Headings, Bulleted/Numbered Lists, Blockquotes, Code Blocks, Undo/Redo) produce clean, semantic HTML that survives refreshes and round-trips through the database deterministically.
   - Paired debounced auto-save (`1200ms`) with an explicit **Save** button and real-time persistence indicator (`Saved to database` / `Saving changes…` / `Unsaved edits…`).

2. **Full-Stack Role-Based Sharing (`Owner`, `Editor`, `Viewer`):**
   - Rather than implementing a binary "shared/not-shared" toggle or a UI-only mock, I prioritized **Role-Based Access Control (Stretch Goal)** enforced at both the API/Service layer and the UI layer.
   - Provided a **1-Click Account Switcher** in the top bar pre-seeded with 4 team personas (plus custom email sign-in) and 3 pre-shared documents so reviewers can verify `Owner`, `Editor`, and `Viewer` permissions immediately without creating multiple browser sessions.

3. **Versatile File Upload & Conversion Pipeline:**
   - Implemented three product-relevant file upload workflows:
     1. **New Document from File:** Converts `.md`, `.txt`, `.docx` (via `mammoth`), and `.html` into a new rich-text document.
     2. **Import into Active Draft:** Appends or replaces content in the current editor from an uploaded file.
     3. **Document Attachments:** Associates uploaded files (`.md`, `.txt`, `.docx`, `.pdf`, `.png`, `.jpg`, `.csv`, `.json` up to 2 MB) with a document for download or 1-click insertion into the draft.

4. **Dual-Mode Persistence (`@libsql/client` for Local SQLite + Turso Cloud):**
   - Reviewers running the project locally should never have to provision external database credentials just to run `npm run dev`, while reviewers testing the live Vercel URL need durable cloud persistence.
   - Using `@libsql/client` solves both with a single codebase: it writes to `file:./local.db` locally when `TURSO_DATABASE_URL` is unset, and connects over HTTP/libSQL to **Turso Cloud SQLite** on Vercel.

---

## 2. System Architecture & Data Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Next.js 14 App Router UI                          │
│  ┌───────────────────┐  ┌────────────────────────┐  ┌────────────────┐  │
│  │ Sidebar & Filters │  │ TipTap RichTextEditor  │  │ Share & Upload │  │
│  │ (All/Owned/Shared)│  │ (Locks on Viewer Role) │  │     Modals     │  │
│  └─────────┬─────────┘  └───────────┬────────────┘  └───────┬────────┘  │
└────────────┼────────────────────────┼───────────────────────┼───────────┘
             │ REST JSON / FormData (Header: x-user-id)       │
             ▼                        ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Next.js Route Handlers (/api/*)                    │
│   /api/documents   /api/documents/[id]   /shares   /attachments  /parse │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            Domain Service & File Parser Layer (Pure TypeScript)         │
│   • src/lib/document-service.ts (CRUD + RBAC Authorization Checks)      │
│   • src/lib/file-parser.ts (.md, .txt, .docx, .html -> Sanitized HTML)  │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Persistence Layer (@libsql/client / SQLite)             │
│   • Production: Turso Cloud SQLite (TURSO_DATABASE_URL)                 │
│   • Local Dev:  file:./local.db   |   Tests: file::memory:              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema (`src/lib/db.ts`)
- **`users`**: `id`, `name`, `email (UNIQUE)`, `avatar_color`, `role_title`, `created_at`
- **`documents`**: `id`, `title`, `content (HTML)`, `owner_id (FK -> users.id)`, `created_at`, `updated_at`
- **`document_shares`**: `id`, `document_id (FK)`, `user_id (FK)`, `role ('editor' | 'viewer')`, `created_at` with `UNIQUE(document_id, user_id)`
- **`document_attachments`**: `id`, `document_id (FK)`, `file_name`, `file_type`, `file_size`, `raw_base64`, `extracted_html`, `uploaded_by_user_id`, `created_at`

---

## 3. Deliberate Scope Cuts & Tradeoffs

| Decision / Scope Cut | Reasoning |
| :--- | :--- |
| **Account Switcher + Lightweight Email Sign-In instead of OAuth/JWT passwords** | Keeps reviewer friction at zero. Reviewers can test 4 seeded accounts or any custom email in 1 click while backend API routes still enforce user-scoped RBAC via `x-user-id`. |
| **Last-Write-Wins HTML Persistence instead of WebSocket CRDTs (Yjs)** | Real-time multi-cursor CRDT synchronization adds operational complexity (stateful WebSocket servers) without improving core single-session evaluation of document editing, file import, and permission logic. |
| **Base64 SQLite Attachment Storage (capped at 2 MB) instead of S3/R2** | Eliminates external AWS/Cloudflare bucket credentials for local reviewers while keeping attachment upload, download, and text extraction self-contained in Turso/SQLite. |
