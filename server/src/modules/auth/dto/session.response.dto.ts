import { UserResponseDto } from '@modules/user/dto/user.response.dto';

export class SessionResponseDto {
  public sessionId: string;

  public token: string;

  public user?: UserResponseDto;
}
