import { useCurrentUser } from '@/entities/user/hooks'; // Типы для состояния Redux

const useMessageItem = (messageUserId: string) => {
  const currentUser = useCurrentUser();

  return {
    isCurrentUser: currentUser.user?.id === messageUserId,
  };
};

export default useMessageItem;
