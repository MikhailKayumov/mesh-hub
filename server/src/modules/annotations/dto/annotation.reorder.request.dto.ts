import { IsArray, IsUUID } from 'class-validator';

export class AnnotationReorderRequestDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  public ids: string[];
}
