const ApiTags = {
  Reset: 'Reset',
  CurrentUser: 'CurrentUser',
} as const;

export type ApiTag = keyof typeof ApiTags;

export default ApiTags;
