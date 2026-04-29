export const ApiKeyScopes = ['embed:read', 'read:models', 'read:scenes'] as const;
export type ApiKeyScope = (typeof ApiKeyScopes)[number];
