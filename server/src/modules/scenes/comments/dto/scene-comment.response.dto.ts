export class SceneCommentAuthorDto {
  public id: string;
  public firstName?: string;
  public lastName?: string;
  public avatarUrl?: string;
}

export class SceneCommentResponseDto {
  public id: string;
  public sceneId: string;
  public body: string;
  public resolved: boolean;
  public parentId: string | null;
  public author: SceneCommentAuthorDto;
  public replies?: SceneCommentResponseDto[];
  public createdAt: Date;
  public updatedAt?: Date;
}
