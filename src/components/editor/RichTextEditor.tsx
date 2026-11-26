'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Lock } from 'lucide-react';
import EditorToolbar from './EditorToolbar';

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

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {readOnly && (
        <div className="no-print flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900">
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            <strong>View-Only Access:</strong> You have <u>Viewer</u> permissions on this shared
            document. Ask the owner for <u>Editor</u> access to modify content.
          </span>
        </div>
      )}

      <EditorToolbar
        editor={editor}
        readOnly={readOnly}
        nightMode={nightMode}
        showPreview={showPreview}
      />

      <div className="flex flex-1 min-h-0">
        <div
          className={`flex h-full min-h-0 flex-col ${
            showPreview ? 'w-full sm:w-1/2 border-r border-[#E8E8E8]' : 'w-full'
          } ${nightMode ? 'bg-[#1E1E1E] text-[#D4D4D4]' : 'bg-white text-[#373D49]'}`}
        >
          <div
            data-testid="editor-pane"
            className={`min-h-0 flex-1 overflow-y-auto px-6 py-5 ${
              nightMode
                ? '[&_.ProseMirror]:text-[#D4D4D4] [&_.ProseMirror_h1]:text-white [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h3]:text-white'
                : ''
            }`}
          >
            <EditorContent editor={editor} />
          </div>

          <div
            className={`no-print flex min-h-10 items-center justify-between border-t px-4 py-2 text-xs text-[#A0AABF] ${
              nightMode ? 'border-[#333333] bg-[#1E1E1E]' : 'border-[#E8E8E8]/60 bg-white'
            }`}
          >
            <div>
              {showWordCount && <span data-testid="word-count">{wordCount} words</span>}
              {showWordCount && showCharCount && <span className="mx-1.5">·</span>}
              {showCharCount && <span data-testid="character-count">{charCount} characters</span>}
            </div>
            <span data-testid="keybinding-mode">Default</span>
          </div>
        </div>

        {showPreview && (
          <div
            className={`print-canvas hidden sm:block w-1/2 h-full overflow-y-auto ${
              nightMode ? 'bg-[#1E1E1E]' : 'bg-[#FAFBFC]'
            }`}
          >
            <div
              id="preview"
              data-testid="preview-pane"
              className={`preview-html min-h-full p-6 sm:p-8 ${nightMode ? 'dark-preview' : ''}`}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
