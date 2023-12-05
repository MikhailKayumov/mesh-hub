const RouterPaths = {
  // common
  Base: '/',

  // auth
  Auth: 'auth',
  Login: 'login',
  Register: 'register',
  ResetPassword: 'reset-password',
  ChangePassword: 'change-password',

  // user
  User: 'user',
  Profile: 'profile',
  Models: 'models',
  Settings: 'settings',

  // editor
  Editor: 'editor',
} as const;

export type RouterPathName = keyof typeof RouterPaths;

export type RouterPath = (typeof RouterPaths)[RouterPathName];

export default RouterPaths;
