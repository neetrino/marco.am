'use client';

import { useEffect, type ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Bold, Italic, Link2, Palette } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-client';
import {
  isProductSubtitleHtmlEmpty,
  normalizeProductSubtitleForEditor,
  sanitizeProductSubtitleHtml,
} from '@/lib/security/sanitize-product-html';

const SUBTITLE_COLORS = [
  { value: '#383838', swatchClass: 'bg-[#383838]' },
  { value: '#dc2626', swatchClass: 'bg-red-600' },
  { value: '#2563eb', swatchClass: 'bg-blue-600' },
  { value: '#16a34a', swatchClass: 'bg-green-600' },
  { value: '#ca8a04', swatchClass: 'bg-yellow-600' },
] as const;

interface ProductSubtitleHtmlEditorProps {
  value: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
        active
          ? 'border-marco-yellow/70 bg-marco-yellow/15 text-marco-black'
          : 'border-slate-200 bg-white text-slate-700 hover:border-marco-yellow/50 hover:bg-marco-yellow/10'
      }`}
    >
      {children}
    </button>
  );
}

export function ProductSubtitleHtmlEditor({ value, onChange }: ProductSubtitleHtmlEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    content: normalizeProductSubtitleForEditor(value),
    editorProps: {
      attributes: {
        class:
          'min-h-[5rem] px-3 py-2 text-sm text-marco-black focus:outline-none prose-p:my-1',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      onChange(isProductSubtitleHtmlEmpty(html) ? '' : sanitizeProductSubtitleHtml(html));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const normalized = normalizeProductSubtitleForEditor(value);
    const current = editor.getHTML();
    const normalizedEmpty = isProductSubtitleHtmlEmpty(normalized);
    const currentEmpty = isProductSubtitleHtmlEmpty(current);

    if (normalizedEmpty && currentEmpty) {
      return;
    }

    if (sanitizeProductSubtitleHtml(current) === sanitizeProductSubtitleHtml(normalized)) {
      return;
    }

    editor.commands.setContent(normalized || '<p></p>', { emitUpdate: false });
  }, [editor, value]);

  const setLink = (): void => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(t('admin.products.add.shortDescriptionLinkPrompt'), previousUrl ?? '');

    if (url === null) {
      return;
    }

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  if (!editor) {
    return (
      <div
        className="min-h-[7.5rem] animate-pulse rounded-lg border border-slate-200 bg-slate-50"
        aria-hidden
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-2 py-1.5">
        <ToolbarButton
          label={t('admin.products.add.shortDescriptionBold')}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label={t('admin.products.add.shortDescriptionItalic')}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label={t('admin.products.add.shortDescriptionLink')}
          active={editor.isActive('link')}
          onClick={setLink}
        >
          <Link2 className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2">
          <Palette className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          {SUBTITLE_COLORS.map(({ value, swatchClass }) => (
            <button
              key={value}
              type="button"
              aria-label={t('admin.products.add.shortDescriptionColor')}
              title={value}
              onClick={() => editor.chain().focus().setColor(value).run()}
              className={`h-5 w-5 rounded-full border border-slate-200 ${swatchClass}`}
            />
          ))}
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
