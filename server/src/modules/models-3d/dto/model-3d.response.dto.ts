import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponse } from '@/modules/common/resources/dto/category.response';
import { Model3dFileResponseDto } from '@/modules/models-3d/dto/model-3d-file.response.dto';

export class Model3dResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public createdAt: Date;

  @ApiPropertyOptional()
  public updatedAt?: Date;

  @ApiProperty()
  public isOwner: boolean;

  @ApiPropertyOptional()
  public ownerAvatar?: string;

  @ApiProperty()
  public ownerName: string;

  @ApiProperty()
  public name: string;

  @ApiProperty({ type: () => Model3dFileResponseDto })
  public file: Model3dFileResponseDto;

  @ApiPropertyOptional()
  public description?: string;

  @ApiPropertyOptional()
  public thumbnail?: string;

  @ApiPropertyOptional({ type: () => CategoryResponse, isArray: true })
  public categories?: CategoryResponse[];
}
