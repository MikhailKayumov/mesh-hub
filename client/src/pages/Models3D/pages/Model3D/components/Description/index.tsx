import { Box } from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { Editor, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import useModel3DContext from '@/contexts/Model3DContext/useModel3DContext.ts';
import classes from '../../Model3DPage.module.scss';

export default function Modal3DPageDescription() {
  const { model } = useModel3DContext();
  const editor: Editor | null = useEditor({ extensions: [StarterKit], content: '', editable: false });

  useEffect(() => {
    model?.description && editor?.commands.setContent(model.description, true);
  }, [editor, model?.description]);
  useEffect(() => () => editor?.destroy(), [editor]);

  if (!model?.description) return;

  return (
    <Box p={24} className={classes.description}>
      <RichTextEditor editor={editor}>
        <RichTextEditor.Content />
      </RichTextEditor>
    </Box>
  );
}
