import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Model3dFileResponseDto } from '@/modules/models-3d/dto/model-3d-file.response.dto';
import { CategoryResponse } from '@/modules/resources/dto/category.response';

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

  @ApiProperty({ enum: ['public', 'private', 'unlisted'] })
  public visibility: string;

  @ApiProperty({ type: () => Model3dFileResponseDto })
  public file: Model3dFileResponseDto;

  @ApiPropertyOptional()
  public description?: Record<string, any>;

  @ApiPropertyOptional()
  public thumbnail?: string;

  @ApiPropertyOptional({ type: () => CategoryResponse, isArray: true })
  public categories?: CategoryResponse[];
}
