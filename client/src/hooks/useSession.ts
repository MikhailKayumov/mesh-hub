import { useSelector } from 'react-redux';
import { sessionSelector } from '@/store/user/selectors.ts';

export function useSession(): string | null {
  return useSelector(sessionSelector) ?? null;
}
