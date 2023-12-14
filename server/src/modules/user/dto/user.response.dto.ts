import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionResponseDto } from '@/modules/auth/dto/session.response.dto';

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

  @ApiProperty()
  public isConfirmed: boolean;

  @ApiPropertyOptional({ type: () => SessionResponseDto, isArray: true })
  public sessions?: SessionResponseDto[];
}
