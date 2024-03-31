import { Link, RichTextEditor } from '@mantine/tiptap';
import Highlight from '@tiptap/extension-highlight';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Editor, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { useModel3DContext } from '@/contexts/Model3DContext/useModel3DContext.ts';

export function Model3DDescription() {
  const model = useModel3DContext();
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
    content: '',
    editable: false,
  });

  useEffect(() => () => editor?.destroy(), [editor]);
  useEffect(() => {
    model?.description && editor?.commands.setContent(model.description, true);
  }, [editor, model?.description]);

  return (
    <RichTextEditor editor={editor}>
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
