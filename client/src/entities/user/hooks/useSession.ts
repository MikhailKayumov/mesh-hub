import { useSelector } from 'react-redux';
import { sessionSelector } from '@/entities/user/store';

export function useSession(): string | null {
  return useSelector(sessionSelector) ?? null;
}
