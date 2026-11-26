# Architecture & Prioritization Note — CESCTOR

**Candidate:** Mochamad Rafli Mudji Prasetyo (`raflimudji@gmail.com`)

---

## 1. Product Philosophy & What We Prioritized

Under a tight delivery constraint, the highest risk in building a Google Docs-inspired product is spreading effort too thinly across heavy infrastructure (e.g., OAuth servers, CRDT WebSockets, object-storage buckets) at the expense of core product coherence.

I prioritized **depth, reliability, clean modular architecture, and zero-friction reviewer testability** across four pillars:

1. **Coherent Rich-Text Editing & Split Live Preview:**
   - Built on **TipTap (ProseMirror)** inside `src/components/editor/` so formatting commands (Bold, Italic, Underline, Strikethrough, H1–H3 Headings, Bulleted/Numbered Lists, Blockquotes, Code Blocks, Undo/Redo) produce clean, semantic HTML that survives refreshes deterministically.
   - Paired debounced auto-save (`1200ms`) with an explicit **Save Session** button and real-time persistence indicator (`Saved` / `Saving…` / `Unsaved`).

2. **Full-Stack Role-Based Sharing (`Owner`, `Editor`, `Viewer`):**
   - Rather than implementing a binary "shared/not-shared" toggle or a UI-only mock, I prioritized **Role-Based Access Control (Stretch Goal)** enforced at both the domain service layer (`src/lib/services/document.service.ts`) and the UI layer.
   - Provided a **1-Click Account Switcher** in the navbar and footer pre-seeded with 4 team personas (plus custom email sign-in) and 3 pre-shared documents so reviewers can verify `Owner`, `Editor`, and `Viewer` permissions immediately without juggling browser sessions.

3. **Versatile File Upload & Conversion Pipeline:**
   - Implemented three product-relevant file upload workflows in `src/lib/utils/file-parser.ts`:
     1. **New Document from File:** Converts `.md`, `.txt`, `.docx` (via `mammoth`), and `.html` into a new rich-text document.
     2. **Import into Active Draft:** Appends or replaces content in the current editor from an uploaded file.
     3. **Document Attachments:** Associates uploaded files (`.md`, `.txt`, `.docx`, `.html`, `.pdf`, `.png`, `.jpg`, `.csv`, `.json` up to 2 MB) with a document for download or 1-click insertion into the draft.

4. **Dual-Mode Persistence (`@libsql/client` for Local SQLite + Turso Cloud):**
   - Reviewers running the project locally never need external database credentials to run `npm run dev`, while reviewers testing the live Vercel URL get durable cloud persistence via **Turso Cloud SQLite**.

---

## 2. System Architecture & Module Boundaries

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       Next.js 14 App Router UI                          │
│   components/layout/   │   components/editor/   │   components/modals/  │
│   Navbar, Sidebar,     │   RichTextEditor,      │   ShareModal, Upload, │
│   StatusFooter         │   EditorToolbar        │   Settings, Shortcuts │
└────────────┬───────────┴────────────┬───────────┴───────────┬───────────┘
             │ REST JSON / FormData (Header: x-user-id)       │
             ▼                        ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                Next.js Route Handlers (src/app/api/*)                   │
│   /api/documents   /api/documents/[id]   /shares   /attachments  /parse │
│                  (delegates HTTP errors to lib/api/http.ts)             │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Domain Services & Pure Utilities                       │
│   • src/lib/services/document.service.ts (CRUD + RBAC Authorization)    │
│   • src/lib/utils/file-parser.ts         (Multi-format HTML & XSS guard)│
│   • src/lib/utils/exporters.ts           (Markdown & HTML export)       │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           Persistence Layer (src/lib/db/client.ts & schema.ts)          │
│   • Production: Turso Cloud SQLite (TURSO_DATABASE_URL)                 │
│   • Local Dev:  file:./local.db   |   Tests: file::memory:              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema (`src/lib/db/schema.ts`)
- **`users`**: `id`, `name`, `email (UNIQUE)`, `avatar_color`, `role_title`, `created_at`
- **`documents`**: `id`, `title`, `content (HTML)`, `owner_id (FK -> users.id)`, `created_at`, `updated_at`
- **`document_shares`**: `id`, `document_id (FK)`, `user_id (FK)`, `role ('editor' | 'viewer')`, `created_at` with `UNIQUE(document_id, user_id)`
- **`document_attachments`**: `id`, `document_id (FK)`, `file_name`, `file_type`, `file_size`, `raw_base64`, `extracted_html`, `uploaded_by_user_id`, `created_at`

---

## 3. Deliberate Scope Cuts & Tradeoffs

| Decision / Scope Cut | Reasoning |
| :--- | :--- |
| **Account Switcher + Lightweight Email Sign-In instead of OAuth/JWT passwords** | Keeps reviewer friction at zero. Reviewers can test 4 seeded accounts or any custom email in 1 click while backend API routes still enforce user-scoped RBAC via `x-user-id`. |
| **Last-Write-Wins HTML Persistence instead of WebSocket CRDTs (Yjs)** | Real-time multi-cursor CRDT synchronization adds stateful WebSocket infrastructure complexity without improving core evaluation of document editing, file import, and permission logic. |
| **Base64 SQLite Attachment Storage (capped at 2 MB) instead of S3/R2** | Eliminates external AWS/Cloudflare bucket credentials for local reviewers while keeping attachment upload, download, and text extraction self-contained in Turso/SQLite. |
