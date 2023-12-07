import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserMetaResponseDto } from '@/modules/user/dto/user.meta.response.dto';

export class UserCurrentResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public email: string;

  @ApiPropertyOptional()
  public phone?: string;

  @ApiPropertyOptional()
  public firstName?: string;

  @ApiPropertyOptional()
  public middleName?: string;

  @ApiPropertyOptional()
  public lastName?: string;

  @ApiProperty()
  public isConfirmed: boolean;

  @ApiProperty({ type: () => UserMetaResponseDto })
  public meta: UserMetaResponseDto;
}
