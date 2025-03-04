import { useDocumentTitle as useMantineDocumentTitle } from '@mantine/hooks';

export function useDocumentTitle(title: string): void {
  useMantineDocumentTitle(`MeshHub | ${title}`);
}
