import { UserResponseDto } from '@modules/user/dto/user.response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  public id: string;

  @ApiPropertyOptional()
  public token?: string;

  @ApiPropertyOptional({ type: () => UserResponseDto })
  public user?: UserResponseDto;
}
