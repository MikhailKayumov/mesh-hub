export const UserRoles = {
  SuperUser: 'super-user',
  Admin: 'admin',
  User: 'user',
} as const;

export type UserRolesType = typeof UserRoles;

export type UserRoleName = keyof UserRolesType;

export type UserRole = UserRolesType[UserRoleName];

export const UserRolesWeights: Record<UserRole, number> = {
  [UserRoles.SuperUser]: 1 << 2,
  [UserRoles.Admin]: 1 << 1,
  [UserRoles.User]: 1,
} as const;

export const UserRolesDescriptions: Record<UserRole, string> = {
  [UserRoles.SuperUser]: 'Суперпользователь',
  [UserRoles.Admin]: 'Администратор',
  [UserRoles.User]: 'Пользователь',
} as const;
