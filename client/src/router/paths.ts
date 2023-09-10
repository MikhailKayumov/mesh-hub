const RouterPaths = {
  Base: '/',
  Login: 'login',
} as const;

export type RouterPathName = keyof typeof RouterPaths;

export type RouterPath = (typeof RouterPaths)[RouterPathName];

export default RouterPaths;
