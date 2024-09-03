import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '@/app/api/auth.ts';
import { userActions } from '@/entities/user/store';
import { RouterPaths } from '@/router/paths.ts';

export function useLogout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();

  return async () => {
    await logout();
    navigate(RouterPaths.Base, { replace: true });
    dispatch(userActions.setSession(null));
  };
}
