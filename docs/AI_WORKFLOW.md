# AI-Native Workflow Note — CESCTOR

**Candidate:** Mochamad Rafli Mudji Prasetyo (`raflimudji@gmail.com`)

---

## 1. AI Tools Used

- **Antigravity (AI Coding Agent & Full-Stack Co-Engineer):** Used for system decomposition, database schema generation, API route scaffolding, TipTap rich-text editor integration, modular UI refactoring, file conversion pipelines, and automated Vitest test authoring.

---

## 2. Where AI Materially Sped Up My Work

1. **Upfront Problem Decomposition & Dual-Mode Persistence Setup (~45 mins saved):**
   - Designed a unified `@libsql/client` persistence layer (`src/lib/db/client.ts` & `src/lib/db/schema.ts`) targeting Turso Cloud (`libsql://`), local SQLite (`file:./local.db`), or in-memory SQLite (`file::memory:`) for tests without rewriting queries.
2. **Multi-Format File Parsing Pipeline (~40 mins saved):**
   - Built `src/lib/utils/file-parser.ts` to unify `.md` (`marked`), `.docx` (`mammoth`), `.txt`, and `.html` conversion into sanitized semantic HTML compatible with TipTap's ProseMirror schema.
3. **Comprehensive Integration & Unit Test Suites (~30 mins saved):**
   - Authored deterministic Vitest suites (`tests/document.service.test.ts` and `tests/file-parser.test.ts`) covering all RBAC permission permutations, attachment round-trips, XSS escaping, and export helpers.
4. **Modular UI Decomposition:**
   - Refactored the workspace into clean, single-responsibility directories (`components/editor`, `components/layout`, `components/modals`, `components/workspace`) matching Dillinger's split-pane layout with CESCTOR branding.

---

## 3. What AI-Generated Output I Changed or Rejected

1. **Rejected Vulnerable Next.js Version (`next@14.2.25` -> Upgraded to `next@14.2.35`):**
   - *Issue:* Initial scaffolding referenced `next@14.2.25`, which carries a security advisory (`CVE-2025-55182`) blocked by Vercel deployments.
   - *Correction:* Upgraded immediately to the patched `next@14.2.35` release.

2. **Rejected Native C++ `better-sqlite3` in Favor of `@libsql/client`:**
   - *Issue:* Native C++ bindings break easily on Windows without build tools and cannot persist across Vercel serverless cold starts.
   - *Correction:* Standardized on `@libsql/client` with Turso Cloud SQLite in production and local/in-memory SQLite for dev and testing.

3. **Rejected UI-Only Permission Hiding in Favor of Service-Layer RBAC Enforcement:**
   - *Issue:* Disabling buttons on the client does not protect REST APIs.
   - *Correction:* Enforced strict authorization checks inside `src/lib/services/document.service.ts` (`updateDocument`, `deleteDocument`, `shareDocumentWithUser`, `addDocumentAttachment`, `getAttachmentBinary`) returning `403 Forbidden` on unauthorized access.

4. **Added HTML Sanitization & XSS Escaping on File Imports:**
   - *Issue:* Loading raw imported `.txt`, `.md`, or `.html` directly into the editor risks script injection.
   - *Correction:* Implemented `escapeHtml` and `sanitizeImportedHtml` and verified them with automated Vitest assertions.

---

## 4. How I Verified Correctness, UX Quality, and Reliability

1. **Static Type Checking (`npm run typecheck`):** Verified strict TypeScript types across all components, routes, services, and tests.
2. **Automated Tests (`npm test`):** Verified CRUD, full RBAC matrix, attachment upload/download, Markdown/PlainText conversion, XSS stripping, file-size/type guards, and Markdown/HTML export helpers.
3. **Production Build (`npm run build`):** Verified clean Next.js production bundling across static and dynamic API routes.
4. **Live Multi-User Browser Verification:** Tested switching between `Rafli (Owner)`, `Sarah (Editor)`, `Alex`, and `Maya (Viewer)` to confirm sidebar filters, View-Only locks, live split preview, and persistence across refreshes.
