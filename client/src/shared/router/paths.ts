export const RouterPaths = {
  // common
  Base: '/',
  Models: 'models-3d',
  Id: ':id',

  // errors
  BadRequest: 'bad-request',
  NotFound: 'not-found',
  Forbidden: 'forbidden',
  ServiceUnavailable: 'service-unavailable',

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
  DevSandbox: 'dev-sandbox',
  UserScenes: 'scenes',

  // editor
  Editor: 'editor',

  // organizations
  Org: 'org',
  OrgId: ':orgId',
  OrgCreate: 'create',
  WorkspaceSeg: 'workspace',
  WorkspaceId: ':workspaceId',

  // embed
  Embed: 'embed',
  EmbedModelId: ':modelId',
  EmbedProjectId: ':projectId',

  // scenes
  Scenes: 'scenes',
  SceneId: ':sceneId',
} as const;

export type RouterPathName = keyof typeof RouterPaths;

export type RouterPath = (typeof RouterPaths)[RouterPathName];
