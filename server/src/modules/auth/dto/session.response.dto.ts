import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '@/modules/user/dto/user.response.dto';

export class SessionResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty({ type: () => UserResponseDto })
  public user: UserResponseDto;

  @ApiProperty()
  public ip: string;

  @ApiPropertyOptional()
  public userAgent?: string;
}
