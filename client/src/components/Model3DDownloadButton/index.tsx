import { Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import useModel3DContext from '@/contexts/Model3DContext/useModel3DContext.ts';
import { getModel3DFileSrc } from '@/utils/model3d.ts';

export default function Model3DDownloadButton() {
  const { model } = useModel3DContext();

  return (
    <Button
      leftSection={<IconDownload size={18} />}
      component="a"
      download
      href={model ? getModel3DFileSrc(model.file.id, model.file.name) : undefined}
    >
      Скачать
    </Button>
  );
}
