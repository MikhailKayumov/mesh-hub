const ApiUrls = {
  Register: 'auth/register',
  Login: 'auth/login',
  Logout: 'auth/logout',

  CurrentUser: 'user/current',
} as const;

export type ApiUrl = keyof typeof ApiUrls;

export default ApiUrls;
