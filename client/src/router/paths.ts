const RouterPaths = {
  // common
  Base: '/',
  Models: 'models',
  Id: ':id',

  // auth
  Auth: 'auth',
  Login: 'login',
  Register: 'register',
  ResetPassword: 'reset-password',
  NewPassword: 'new-password',

  // user
  User: 'user',
  Profile: 'profile',
  Settings: 'settings',

  // editor
  Editor: 'editor',
} as const;

export type RouterPathName = keyof typeof RouterPaths;

export type RouterPath = (typeof RouterPaths)[RouterPathName];

export default RouterPaths;
