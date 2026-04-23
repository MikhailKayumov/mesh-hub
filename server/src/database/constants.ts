export const Databases = [process.env['POSTGRES_DB'] ?? 'mesh_hub'];

export const DatabaseSchemas = {
  Public: 'public',
  Resources: 'resources',
  Auth: 'auth',
  Users: 'users',
  Models3D: 'model_3d',
  Organizations: 'organizations',
  Workspaces: 'workspaces',
  Embed: 'embed',
} as const;

export const ResourcesSchemaTables = {
  CgSoft: 'cg_soft',
  Category: 'category',
} as const;

export const AuthSchemaTables = {
  Session: 'session',
} as const;

export const UserSchemaTables = {
  User: 'user',
  UserMeta: 'user_meta',
  UserMetaCgSoft: 'user_meta_cg_soft',
  Role: 'role',
  UserRole: 'user_role',
  UserResetPassword: 'user_reset_password',
} as const;

export const Models3DSchemaTables = {
  Model3D: 'model_3d',
  Model3DFile: 'model_3d_file',
  Model3DCategories: 'model_3d_categories',
  ModelComment: 'model_comment',
  ModelAnnotation: 'model_annotation',
} as const;

export const OrganizationsSchemaTables = {
  Organization: 'organization',
  OrgMember: 'org_member',
  OrgSubscription: 'org_subscription',
  OrgInvite: 'org_invite',
} as const;

export const WorkspacesSchemaTables = {
  Workspace: 'workspace',
  WorkspaceMember: 'workspace_member',
} as const;

export const EmbedSchemaTables = {
  ApiKey: 'api_key',
  EmbedProject: 'embed_project',
  EmbedDomainWhitelist: 'embed_domain_whitelist',
  ModelViewLog: 'model_view_log',
} as const;
