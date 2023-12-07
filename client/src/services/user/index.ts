import { UserCurrentResponseDto } from '@/api/dto.ts';

class UserService {
  public getAvatarInitials(user: UserCurrentResponseDto): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }

  public getInitials(user: UserCurrentResponseDto): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }

  public getUserFullname(user: UserCurrentResponseDto, withMiddleName = false): string {
    return `${user.firstName}${withMiddleName && user.middleName ? ` ${user.middleName}` : ''} ${user.lastName}`;
  }
}

const userService = new UserService();

export default userService;
