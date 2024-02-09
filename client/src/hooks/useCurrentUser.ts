import { UserCurrentResponseDto } from '@/api/dto.ts';
import { useCurrentUserQuery } from '@/api/user.ts';
import { useSession } from './useSession.ts';

export interface UseCurrentUserReturn {
  isUserLoading: boolean;
  user: UserCurrentResponseDto | null;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const session = useSession();
  const { data, isLoading } = useCurrentUserQuery(undefined, { skip: !session });
  const user = session && data ? data : null;

  return {
    user,
    isUserLoading: isLoading && !user,
  };
}
