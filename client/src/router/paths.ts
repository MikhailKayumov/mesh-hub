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
  MyProfile: 'my-profile',
  MyModels: 'my-models',
  MySettings: 'my-settings',

  // editor
  Editor: 'editor',
} as const;

export type RouterPathName = keyof typeof RouterPaths;

export type RouterPath = (typeof RouterPaths)[RouterPathName];

export default RouterPaths;
