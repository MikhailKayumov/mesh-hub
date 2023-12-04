import { UserResponseDto } from '@/api/dto.ts';
import { useCurrentUserQuery } from '@/api/user.ts';
import useSession from './useSession.ts';

export interface UseCurrentUserReturn {
  isUserLoading: boolean;
  user?: UserResponseDto;
}

export default function useCurrentUser(): UseCurrentUserReturn {
  const session = useSession();
  const { data, isLoading } = useCurrentUserQuery(undefined, { skip: !session });
  const user = session && data ? data : session?.user;

  return {
    user,
    isUserLoading: isLoading && !user,
  };
}
