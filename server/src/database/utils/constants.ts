export const DatabaseSchemas = {
  Auth: 'auth',
  User: 'users',
} as const;

export const schemas = Object.values(DatabaseSchemas);

export const databases = ['meshhub', 'meshhub_test'];
