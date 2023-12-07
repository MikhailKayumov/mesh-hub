export const Databases = ['meshhub', 'meshhub_test'];

export const DatabaseSchemas = {
  Public: 'public',
  Resources: 'resources',
  Auth: 'auth',
  Users: 'users',
} as const;

export const ResourcesSchemaTables = {
  CgSoft: 'cg_soft',
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
