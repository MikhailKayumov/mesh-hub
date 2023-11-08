import { SessionResponseDto } from '@modules/auth/dto/session.response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public email: string;

  @ApiPropertyOptional()
  public firstName?: string;

  @ApiPropertyOptional()
  public middleName?: string;

  @ApiPropertyOptional()
  public lastName?: string;

  @ApiPropertyOptional()
  public nickname?: string;

  @ApiPropertyOptional({ type: () => SessionResponseDto, isArray: true })
  public sessions?: SessionResponseDto[];
}
