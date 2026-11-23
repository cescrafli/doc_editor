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
  showPreview: boolean;
  nightMode: boolean;
  showWordCount?: boolean;
  showCharCount?: boolean;
  onChange: (html: string) => void;
}

export default function RichTextEditor({
  documentId,
  content,
  readOnly,
  showPreview,
  nightMode,
  showWordCount = true,
  showCharCount = true,
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
          '# Welcome to Cesctor\n\nA clean, distraction-free collaborative editor. Type on the left, see the rendered output on the right…',
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content, false);
    }
  }, [documentId, content, editor]);

  if (!editor) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white text-sm text-[#A0AABF]">
        Loading Cesctor editor…
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
      className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
        active
          ? 'bg-[#35D7BB]/20 text-[#2B2F36] font-semibold ring-1 ring-[#35D7BB]'
          : nightMode
          ? 'text-[#A0AABF] hover:bg-[#373D49] hover:text-white'
          : 'text-[#373D49] hover:bg-[#F5F7FA] hover:text-[#2B2F36]'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Read-Only Banner for Viewer role */}
      {readOnly && (
        <div className="no-print flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900">
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            <strong>View-Only Access:</strong> You have <u>Viewer</u> permissions on this shared
            document. Ask the owner for <u>Editor</u> access to modify content.
          </span>
        </div>
      )}

      {/* Rich-Text Formatting Sub-Toolbar */}
      <div
        className={`no-print flex flex-wrap items-center gap-0.5 border-b px-4 py-1.5 ${
          nightMode
            ? 'border-[#373D49] bg-[#2B2F36]'
            : 'border-[#E8E8E8] bg-[#FAFBFC]'
        }`}
      >
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="mx-1.5 h-4 w-px bg-[#E8E8E8]" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          title="Normal Text"
        >
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="mx-1.5 h-4 w-px bg-[#E8E8E8]" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="mx-1.5 h-4 w-px bg-[#E8E8E8]" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bulleted List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="mx-1.5 h-4 w-px bg-[#E8E8E8]" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <span className="ml-auto hidden text-[11px] font-medium text-[#A0AABF] md:inline">
          {showPreview ? 'Split View: Editor (Left) · Live Preview (Right)' : 'Full Editor View'}
        </span>
      </div>

      {/* Main Split Container (Dillinger 50/50 Split Layout) */}
      <div className="flex flex-1 min-h-0">
        {/* Left Pane: Interactive Rich-Text Editor */}
        <div
          className={`flex h-full min-h-0 flex-col ${
            showPreview
              ? 'w-full sm:w-1/2 border-r border-[#E8E8E8]'
              : 'w-full'
          } ${nightMode ? 'bg-[#1E1E1E] text-[#D4D4D4]' : 'bg-white text-[#373D49]'}`}
        >
          <div
            data-testid="editor-pane"
            className={`min-h-0 flex-1 overflow-y-auto px-6 py-5 ${
              nightMode ? '[&_.ProseMirror]:text-[#D4D4D4] [&_.ProseMirror_h1]:text-white [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h3]:text-white' : ''
            }`}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Dillinger Bottom Status Bar (Word Count · Character Count | Mode) */}
          <div
            className={`no-print flex min-h-10 items-center justify-between border-t px-4 py-2 text-xs text-[#A0AABF] ${
              nightMode
                ? 'border-[#333333] bg-[#1E1E1E]'
                : 'border-[#E8E8E8]/60 bg-white'
            }`}
          >
            <div>
              {showWordCount && (
                <span data-testid="word-count">{wordCount} words</span>
              )}
              {showWordCount && showCharCount && <span className="mx-1.5">·</span>}
              {showCharCount && (
                <span data-testid="character-count">{charCount} characters</span>
              )}
            </div>
            <span data-testid="keybinding-mode">Default</span>
          </div>
        </div>

        {/* Right Pane: Dillinger Live Document Preview */}
        {showPreview && (
          <div
            className={`print-canvas hidden sm:block w-1/2 h-full overflow-y-auto ${
              nightMode ? 'bg-[#1E1E1E]' : 'bg-[#FAFBFC]'
            }`}
          >
            <div
              id="preview"
              data-testid="preview-pane"
              className={`preview-html min-h-full p-6 sm:p-8 ${
                nightMode ? 'dark-preview' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
