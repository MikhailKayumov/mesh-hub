const RouterPaths = {
  // common
  Base: '/',

  // pages
  Login: 'login',
  Profile: 'profile',

  // editor
  Editor: 'editor',

  // uikit
  UiKit: 'uikit',
  UiKitButtons: 'buttons',
  UiKitTypography: 'typography',
} as const;

export type RouterPathName = keyof typeof RouterPaths;

export type RouterPath = (typeof RouterPaths)[RouterPathName];

export default RouterPaths;
