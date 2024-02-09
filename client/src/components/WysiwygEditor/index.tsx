import { Input } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import Highlight from '@tiptap/extension-highlight';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Editor, useEditor, EditorEvents, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebounced.ts';
import classes from './WysiwygEditor.module.scss';

export interface WysiwygEditorProps {
  value?: JSONContent;
  onChange: (content: JSONContent | null) => void;
  label?: string;
  className?: string;
}

export function WysiwygEditor({ value, label, className, onChange }: WysiwygEditorProps) {
  const onUpdate = useDebouncedCallback((e: EditorEvents['update']) => {
    onChange(!e.editor.isEmpty ? e.editor.getJSON() : null);
  });
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate,
  });
  const focus = () => {
    if (editor?.isFocused) return;
    editor?.commands.focus('end');
  };

  useEffect(() => () => editor?.destroy(), [editor]);

  return (
    <Input.Wrapper className={clsx(classes.wrapper, className)}>
      <Input.Label onClick={focus}>{label}</Input.Label>
      <RichTextEditor editor={editor}>
        <RichTextEditor.Toolbar sticky stickyOffset={-10}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Highlight />
            <RichTextEditor.Code />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Subscript />
            <RichTextEditor.Superscript />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignJustify />
            <RichTextEditor.AlignRight />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content className={classes.content} onClick={focus} />
      </RichTextEditor>
    </Input.Wrapper>
  );
}
