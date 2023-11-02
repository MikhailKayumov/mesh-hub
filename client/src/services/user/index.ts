import { UserResponseDto } from '@/api/dto.ts';

class UserService {
  public getInitials(user: UserResponseDto): string {
    return `${user.firstName ? user.firstName[0] : ''}${user.lastName ? user.lastName[0] : ''}`.toUpperCase();
  }
}

const userService = new UserService();

export default userService;
