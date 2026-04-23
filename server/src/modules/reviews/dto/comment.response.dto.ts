export class CommentAuthorDto {
  public id: string;
  public firstName?: string;
  public lastName?: string;
  public avatar?: string;
}

export class CommentPosDto {
  public x: number;
  public y: number;
  public z: number;
}

export class CommentResponseDto {
  public id: string;
  public body: string;
  public pos: CommentPosDto | null;
  public resolved: boolean;
  public parentId: string | null;
  public author: CommentAuthorDto;
  public createdAt: Date;
  public updatedAt?: Date;
}
