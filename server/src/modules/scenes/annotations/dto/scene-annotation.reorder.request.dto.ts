import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsUUID, ValidateNested } from 'class-validator';

export class SceneAnnotationReorderItemDto {
  @IsUUID()
  public id: string;

  @IsInt()
  public order: number;
}

export class SceneAnnotationReorderRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SceneAnnotationReorderItemDto)
  public items: SceneAnnotationReorderItemDto[];
}
