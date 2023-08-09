export const Routes = {
  Login: 'auth/login',
  Refresh: 'auth/refresh',
  User: 'user',
} as const;

export type Route = (typeof Routes)[keyof typeof Routes];
