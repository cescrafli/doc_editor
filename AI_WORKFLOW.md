# AI-Native Workflow Note — Ajaia Docs

**Candidate:** Mochamad Rafli Mudji Prasetyo (`raflimudji@gmail.com`)

---

## 1. AI Tools Used

- **Antigravity (AI Coding Agent & Full-Stack Co-Engineer):** Used for system decomposition, schema generation, API route scaffolding, TipTap rich-text editor integration, file conversion pipelines, and automated Vitest test authoring.

---

## 2. Where AI Materially Sped Up My Work

1. **Upfront Problem Decomposition & Dual-Mode Persistence Setup (~45 mins saved):**
   - Rather than manually wiring separate database drivers for local development, unit testing, and serverless production, I prompted the AI to design a unified `@libsql/client` persistence adapter (`src/lib/db.ts`) that seamlessly targets Turso Cloud (`libsql://`), local SQLite (`file:./local.db`), or in-memory SQLite (`file::memory:`) for tests.
2. **Multi-Format File Parsing Pipeline (~40 mins saved):**
   - Accelerated building `src/lib/file-parser.ts` to unify `.md` (via `marked`), `.docx` (via `mammoth`), `.txt`, and `.html` conversion into sanitized semantic HTML compatible with TipTap's ProseMirror schema.
3. **Comprehensive Integration Test Suite (~30 mins saved):**
   - Rapidly generated deterministic integration tests (`src/__tests__/document-service.test.ts`) covering all permission permutations (`Owner` vs `Editor` vs `Viewer` vs `Unauthorized`) and file validation edge cases against an isolated in-memory database.
4. **UI Component Scaffolding:**
   - Accelerated Tailwind UI layout for the split-pane document browser, formatting toolbar, role-based `ShareModal`, and multi-mode `FileUploadModal`.

---

## 3. What AI-Generated Output I Changed or Rejected

Using AI effectively requires active engineering judgment rather than blind acceptance. Key modifications and rejections included:

1. **Rejected Vulnerable Next.js Version (`next@14.2.25` -> Upgraded to `next@14.2.35`):**
   - *Issue:* Initial package scaffolding specified `next@14.2.25`, which carries a known security advisory (`CVE-2025-55182`) that causes Vercel's deployment pipeline to block production builds.
   - *Correction:* Immediately audited the install output and upgraded to the patched `next@14.2.35` release so production builds and Vercel deployments succeed cleanly.

2. **Rejected Native C++ `better-sqlite3` in Favor of `@libsql/client`:**
   - *Issue:* Standard AI boilerplate often suggests `better-sqlite3` for SQLite persistence. However, native C++ bindings frequently fail on Windows without Visual Studio C++ Build Tools and cannot persist data across Vercel serverless function cold starts.
   - *Correction:* Directed the architecture to use `@libsql/client` with Turso Cloud in production and local file/in-memory fallbacks for local development and tests.

3. **Rejected UI-Only Permission Hiding in Favor of Service-Layer RBAC Enforcement:**
   - *Issue:* Naive sharing implementations only disable the editor toolbar on the frontend when a user is a `Viewer`.
   - *Correction:* Enforced strict authorization checks inside `src/lib/document-service.ts` (`updateDocument`, `deleteDocument`, `shareDocumentWithUser`, `addDocumentAttachment`) so unauthorized API calls return `403 Forbidden` regardless of client state.

4. **Added HTML Sanitization & XSS Escaping on File Imports:**
   - *Issue:* Converting raw `.txt`, `.md`, or `.html` files directly into `innerHTML` / TipTap content risks script injection if an uploaded file contains `<script>` tags or inline event handlers (`onload=...`).
   - *Correction:* Added explicit HTML entity escaping for `.txt` imports (`escapeHtml`) and tag/attribute stripping (`sanitizeImportedHtml`) for `.md`, `.docx`, and `.html` imports, and verified it with an automated XSS test case.

---

## 4. How I Verified Correctness, UX Quality, and Reliability

1. **Automated Integration & Security Tests (`npm test`):**
   - Wrote and executed 5 multi-assertion Vitest tests against `file::memory:` verifying:
     - Database initialization and default multi-user seeding.
     - Document creation, inline renaming, and rich-text HTML persistence.
     - Complete RBAC enforcement (`Viewer` blocked from `PATCH /api/documents/[id]` and attachment uploads; `Editor` allowed to edit content/title but blocked from deleting documents or modifying shares; `Unshared` user blocked from reading).
     - Markdown & Plain Text conversion accuracy and XSS payload escaping.
     - Rejection of unsupported file extensions (`.exe`) and files exceeding the 2 MB limit.
2. **Production Build & Type Checking (`npm run build`):**
   - Verified strict TypeScript compilation and Next.js production bundling across all pages and dynamic API routes.
3. **End-to-End Multi-User UX Verification:**
   - Tested switching between `Rafli Prasetyo (Owner)`, `Sarah Chen (Editor)`, `Alex Rivera`, and `Maya Patel (Viewer)` in the browser to confirm that:
     - `Owned` vs `Shared` filter tabs and role badges update immediately.
     - Opening a document as a `Viewer` displays the amber View-Only banner and locks the TipTap editor and title input.
     - Refreshing the browser preserves all document edits, formatting, and sharing changes.
