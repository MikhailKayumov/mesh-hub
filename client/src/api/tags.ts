const ApiTags = {
  Reset: 'Reset',
  CurrentUser: 'CurrentUser',
  CGSoft: 'CGSoft',
} as const;

export type ApiTag = keyof typeof ApiTags;

export default ApiTags;
