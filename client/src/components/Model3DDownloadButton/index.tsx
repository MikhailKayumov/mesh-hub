import { Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { Model3DFileResponseDto } from '@/api/dto.ts';
import { getModel3DFileSrc } from '@/utils/model3d.ts';

export interface Model3DDownloadButtonProps {
  file: Model3DFileResponseDto;
}

export default function Model3DDownloadButton({ file }: Model3DDownloadButtonProps) {
  return (
    <Button
      leftSection={<IconDownload size={18} />}
      component="a"
      download
      href={getModel3DFileSrc(file.id, file.name)}
    >
      Скачать
    </Button>
  );
}
