import { RichTextEditor } from '@mantine/tiptap';
import { Editor, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import useModel3DContext from '@/contexts/Model3DContext/useModel3DContext.ts';

export default function Model3DDescription() {
  const model = useModel3DContext();
  const editor: Editor | null = useEditor({ extensions: [StarterKit], content: '', editable: false });

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
