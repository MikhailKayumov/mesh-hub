export class AnnotationPosDto {
  public x: number;
  public y: number;
  public z: number;
}

export class AnnotationResponseDto {
  public id: string;
  public label: string;
  public body?: string;
  public pos: AnnotationPosDto;
  public cameraPos: AnnotationPosDto | null;
  public order: number;
  public createdAt: Date;
  public updatedAt?: Date;
}
