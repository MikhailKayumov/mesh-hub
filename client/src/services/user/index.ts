import { UserResponseDto } from '@/api/dto.ts';

class UserService {
  public getAvatarInitials(user: UserResponseDto): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }

  public getInitials(user: UserResponseDto): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }

  public getUserFullname(user: UserResponseDto, withMiddleName = false): string {
    return `${user.firstName}${withMiddleName && user.middleName ? ` ${user.middleName}` : ''} ${user.lastName}`;
  }
}

const userService = new UserService();

export default userService;
