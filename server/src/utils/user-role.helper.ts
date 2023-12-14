import { UserRole } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';

export class UserRoleHelper {
  public static hasRole(user: UserEntity, role: UserRole): boolean {
    return !!user.roles.find((userRole) => userRole.name === role);
  }

  public static hasSomeRoles(user: UserEntity, roles: UserRole[]): boolean {
    return user.roles.some((userRole) => roles.includes(userRole.name));
  }

  public static hasEveryRoles(user: UserEntity, roles: UserRole[]): boolean {
    return user.roles.every((userRole) => roles.includes(userRole.name));
  }
}
