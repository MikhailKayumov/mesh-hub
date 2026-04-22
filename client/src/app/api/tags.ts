export const ApiTags = {
  Reset: 'Reset',
  CurrentUser: 'CurrentUser',
  CGSoft: 'CGSoft',
  Categories: 'Categories',
  Get3DModels: 'Get3DModels',
  Get3DModel: 'Get3DModels',
  CurrentUser3DModels: 'CurrentUser3DModels',
  CurrentUser3DModel: 'CurrentUser3DModel',
  Organization: 'Organization',
  OrgMembers: 'OrgMembers',
  OrgSubscription: 'OrgSubscription',
  Workspaces: 'Workspaces',
  Workspace: 'Workspace',
} as const;

export type ApiTag = keyof typeof ApiTags;
