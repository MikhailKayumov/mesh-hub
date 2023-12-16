const ApiUrls = {
  // auth
  Register: 'auth/signup',
  Login: 'auth/login',
  Logout: 'auth/logout',
  Refresh: 'auth/refresh',
  CurrentUserSessions: 'auth/current-user-sessions',
  CloseCurrentUserSessions: 'auth/current-user-sessions',
  // user
  CurrentUser: 'user/current',
  UpdateCurrentUserAvatar: 'user/current/avatar',
  ResetPassword: 'user/reset-password',
  NewPassword: 'user/new-password',
  ChangePassword: 'user/change-password',
  // resources
  ResourcesCGSoft: 'resources/cg-soft/all',
} as const;

export type ApiUrl = keyof typeof ApiUrls;

export default ApiUrls;
