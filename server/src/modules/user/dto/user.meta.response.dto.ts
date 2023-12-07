import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CgSoftResponse } from '@/modules/common/resources/dto/cg-soft.response';

export class UserMetaResponseDto {
  @ApiProperty()
  public id: string;

  @ApiPropertyOptional()
  public aboutYourself?: string;

  @ApiPropertyOptional({ type: () => CgSoftResponse, isArray: true })
  public favoriteSoft?: CgSoftResponse[];
}
