import { FetchQueryError } from '@/app/api/base.ts';
import { UserCurrentResponseDto } from '@/app/api/dto.ts';
import { useCurrentUserQuery } from '@/app/api/user.ts';

export interface UseCurrentUserReturn {
  isUserLoading: boolean;
  user: UserCurrentResponseDto | null;
  error?: FetchQueryError;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { data, isLoading, error } = useCurrentUserQuery();

  return {
    user: data ?? null,
    error,
    isUserLoading: isLoading,
  };
}
