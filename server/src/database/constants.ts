export const Databases = ['meshhub' /*, 'meshhub_test'*/];

export const DatabaseSchemas = {
  Public: 'public',
  Resources: 'resources',
  Auth: 'auth',
  Users: 'users',
  Models3D: 'model_3d',
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
} as const;
