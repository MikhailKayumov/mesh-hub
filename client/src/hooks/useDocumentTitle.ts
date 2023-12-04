import { useDocumentTitle as useMantineDocumentTitle } from '@mantine/hooks';

export default function useDocumentTitle(title: string): void {
  useMantineDocumentTitle(`MeshHub | ${title}`);
}
