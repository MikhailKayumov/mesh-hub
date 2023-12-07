const ApiUrls = {
  // auth
  Register: 'auth/signup',
  Login: 'auth/login',
  Logout: 'auth/logout',
  Refresh: 'auth/refresh',
  // user
  CurrentUser: 'user/current',
  ResetPassword: 'user/reset-password',
  NewPassword: 'user/new-password',
  ChangePassword: 'user/change-password',
  // resources
  ResourcesCGSoft: 'resources/cg-soft/all',
} as const;

export type ApiUrl = keyof typeof ApiUrls;

export default ApiUrls;
