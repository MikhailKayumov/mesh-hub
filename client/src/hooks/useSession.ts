import { useSelector } from 'react-redux';
import { SessionResponseDto } from '@/api/dto.ts';
import { sessionSelector } from '@/store/user/selectors.ts';

export default function useSession(): SessionResponseDto | null {
  return useSelector(sessionSelector) ?? null;
}
