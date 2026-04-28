export class SceneAnnotationAuthorDto {
  public id: string;
  public firstName?: string;
  public lastName?: string;
  public avatarUrl?: string;
}

export class SceneAnnotationPosDto {
  public x: number;
  public y: number;
  public z: number;
}

export class SceneAnnotationResponseDto {
  public id: string;
  public sceneId: string;
  public sceneObjectId: string | null;
  public label: string;
  public body: string | null;
  public pos: SceneAnnotationPosDto;
  public cameraPos: SceneAnnotationPosDto | null;
  public order: number;
  public author: SceneAnnotationAuthorDto;
  public createdAt: Date;
  public updatedAt?: Date;
}
