'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';
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
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
  readOnly: boolean;
  nightMode: boolean;
  showPreview: boolean;
}

export default function EditorToolbar({
  editor,
  readOnly,
  nightMode,
  showPreview,
}: EditorToolbarProps) {
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
    <div
      className={`no-print flex flex-wrap items-center gap-0.5 border-b px-4 py-1.5 ${
        nightMode ? 'border-[#373D49] bg-[#2B2F36]' : 'border-[#E8E8E8] bg-[#FAFBFC]'
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
  );
}
