# Panduan & Script Rekaman Walkthrough Video (3–5 Menit)

Gunakan **Loom** atau **OBS / Screen Recorder (upload Unlisted ke YouTube)**. Target durasi: **3.5 – 4.5 menit**.

---

## Persiapan Sebelum Klik Record (30 Detik)
1. Buka tab browser ke **Live Vercel URL** aplikasi kamu (atau `http://localhost:3000`).
2. Pastikan akun aktif di pojok kanan atas adalah **Rafli Prasetyo (`raflimudji@gmail.com`)**.
3. Siapkan file `samples/sample-import.md` di komputer kamu untuk didemokan saat upload file.
4. Buka juga code editor / terminal yang menampilkan hasil `npm test` (5 tests passed) dan file `src/lib/document-service.ts`.

---

## Script Rekaman Scene-by-Scene

### Scene 1: Intro & Product Overview (0:00 – 0:40)
> *"Hi Ajaia team, I'm Mochamad Rafli Mudji Prasetyo. This is my walkthrough for the AI-Native Full Stack Developer Assignment — **Ajaia Docs**, a lightweight collaborative document workspace built with Next.js 14, TypeScript, TipTap Rich-Text Editor, and Turso Cloud SQLite."*
>
> *"My goal within the timebox was to ship a cohesive, production-deployed product slice covering rich-text creation and editing, multi-format file upload and conversion, role-based sharing with Owner, Editor, and Viewer permissions, and durable persistence."*

### Scene 2: Document Creation, Rich-Text Formatting & Persistence (0:40 – 1:35)
- *(Klik dokumen pertama atau klik **+ New Document**)*
- *(Ubah judul dokumen di bagian atas, lalu ketik beberapa baris di editor: gunakan **Heading 1/2**, **Bold**, **Italic**, **Underline**, **Bulleted List**, dan **Numbered List**)*
> *"Here in the editor, users can create a document, rename it inline, and format content with headings, bold, italic, underline, lists, blockquotes, and code blocks. Notice the live save indicator at the top — edits auto-save after a short debounce or via the manual Save button, and persist to our Turso SQLite database. If I refresh the browser right now, all content and structure remain intact. We also support exporting any document to Markdown or printing to PDF."*

### Scene 3: File Upload & Conversion Workflow (1:35 – 2:25)
- *(Klik tombol **Upload / Import File** di top bar)*
> *"For file upload, I implemented three product-relevant workflows and explicitly documented supported formats and the 2 MB limit in both the UI and README:*
> *1. Turning a `.md`, `.txt`, `.docx`, or `.html` file directly into a new editable rich-text document.*
> *2. Importing file content into the current draft (append or replace).*
> *3. Attaching reference files to a document."*
- *(Pilih **New Document**, lalu pilih file `samples/sample-import.md` dan klik **Upload & Open as Document**)*
> *"As you can see, uploading `sample-import.md` parses the Markdown structure into clean semantic HTML inside TipTap so we can immediately edit and collaborate on it."*

### Scene 4: Role-Based Sharing & Access Control (2:25 – 3:25)
- *(Klik tombol **Share** pada dokumen yang baru dibuat)*
> *"For sharing, I implemented role-based permissions beyond basic access: **Owner**, **Editor**, and **Viewer**. From the Share modal, I can pick from seeded team accounts or enter any email."*
- *(Share ke **Sarah Chen** sebagai **Editor**, dan ke **Maya Patel** sebagai **Viewer**, lalu tutup modal)*
- *(Klik **Account Switcher** di pojok kanan atas, ganti ke **Maya Patel**)*
> *"To make reviewing effortless without multiple logins, I added a 1-click Account Switcher in the top right. Switching to **Maya Patel**, we can filter the left sidebar between **All**, **Owned**, and **Shared** documents. When Maya opens the document as a **Viewer**, a View-Only banner appears, the title and formatting toolbar are locked, and backend write APIs enforce `403 Forbidden`. If I switch to **Sarah Chen** (who has **Editor** access), she can edit content and upload files, while only the **Owner** can manage shares or delete the document."*

### Scene 5: Architecture, Deliberate Scope Cuts & AI-Native Workflow (3:25 – 4:20)
- *(Tampilkan singkat terminal `npm test` atau file `src/lib/document-service.ts` / `ARCHITECTURE.md`)*
> *"On the engineering side, I intentionally prioritized depth in the core workflows and decoupled business logic into `document-service.ts` and `file-parser.ts`. I deliberately scoped out WebSocket CRDTs and complex OAuth flows in favor of deterministic REST auto-save and the 1-click Account Switcher so reviewers can test every role permutation immediately."*
>
> *"Finally, on my AI workflow: I used Antigravity to accelerate database schema scaffolding, multi-format file parsing, and Vitest integration test authoring. However, I actively audited and modified AI outputs — for example, upgrading a deprecated Next.js 14.2.25 version to patched 14.2.35 so Vercel wouldn't block the build, choosing `@libsql/client` over native `better-sqlite3` so local SQLite and Turso Cloud work seamlessly, adding XSS sanitization on file imports, and enforcing role checks on the server layer verified by automated Vitest tests. Thank you for reviewing my submission!"*
