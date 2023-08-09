import { SessionResponseDto } from '@modules/auth/dto/session.response.dto';

export class UserResponseDto {
  public id: string;

  public email: string;

  public firstName?: string;

  public middleName?: string;

  public lastName?: string;

  public nickname?: string;

  public sessions?: SessionResponseDto[];
}
