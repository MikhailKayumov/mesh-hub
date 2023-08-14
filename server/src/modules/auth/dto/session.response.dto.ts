import { UserResponseDto } from '@modules/user/dto/user.response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  public sessionId: string;

  @ApiProperty()
  public token: string;

  @ApiPropertyOptional({ type: () => UserResponseDto })
  public user?: UserResponseDto;
}
