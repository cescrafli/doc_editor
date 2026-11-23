'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  RemoveFormatting,
  Lock,
} from 'lucide-react';

interface RichTextEditorProps {
  documentId: string;
  content: string;
  readOnly: boolean;
  onChange: (html: string) => void;
}

export default function RichTextEditor({
  documentId,
  content,
  readOnly,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder:
          'Start typing your document here, or use "Import File" in the top bar to load a .md, .txt, or .docx file…',
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Sync editable state when role changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Sync content when switching documents or importing file content externally
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content, false);
    }
  }, [documentId, content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[520px] animate-pulse rounded-xl border border-slate-200 bg-white p-10">
        <div className="mb-4 h-7 w-1/3 rounded bg-slate-100" />
        <div className="mb-2.5 h-4 w-full rounded bg-slate-100" />
        <div className="mb-2.5 h-4 w-5/6 rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
      </div>
    );
  }

  const plainText = editor.getText();
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;

  const ToolbarBtn = ({
    onClick,
    active = false,
    disabled = false,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || readOnly}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
        active
          ? 'bg-indigo-100 text-indigo-700 font-semibold'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col">
      {/* Read-Only Banner for Viewer role */}
      {readOnly && (
        <div className="no-print mb-3 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
          <Lock className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>View-Only Mode:</strong> You have <u>Viewer</u> access to this shared document.
            Editing, renaming, and file imports are disabled. Ask the owner to upgrade your role to{' '}
            <u>Editor</u> to make changes.
          </span>
        </div>
      )}

      {/* Rich-Text Formatting Toolbar */}
      <div className="no-print sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        {/* Undo / Redo */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* Headings & Text Size Variation */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          title="Normal Text"
        >
          <Pilcrow className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1 (Large Title)"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2 (Section Header)"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3 (Subsection)"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* Text Inline Marks: Bold, Italic, Underline, Strikethrough */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* Lists: Bulleted & Numbered */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bulleted List"
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* Blockquote, Code Block, Clear Formatting */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote Block"
        >
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarBtn>

        <div className="ml-auto hidden items-center gap-3 text-xs text-slate-400 sm:flex">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Document Page Canvas */}
      <div
        className={`print-canvas mx-auto w-full max-w-4xl rounded-xl border bg-white px-8 py-10 shadow-sm transition-colors sm:px-14 sm:py-12 ${
          readOnly ? 'border-slate-200 bg-slate-50/40' : 'border-slate-200'
        }`}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
