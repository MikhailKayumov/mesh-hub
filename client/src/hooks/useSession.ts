import { useSelector } from 'react-redux';
import { SessionResponseDto } from '@/api/dto.ts';
import { sessionSelector } from '@/store/user/selectors.ts';

export default function useSession(): SessionResponseDto | null {
  const session = useSelector(sessionSelector);

  return session && session.user ? session : null;
}
