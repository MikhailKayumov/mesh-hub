const ApiTags = {
  Reset: 'Reset',
  CurrentUser: 'CurrentUser',
  CGSoft: 'CGSoft',
  Get3DModels: 'Get3DModels',
  Get3DModel: 'Get3DModels',
  CurrentUser3DModels: 'CurrentUser3DModels',
  CurrentUser3DModel: 'CurrentUser3DModel',
} as const;

export type ApiTag = keyof typeof ApiTags;

export default ApiTags;
