import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public name: string;

  @ApiProperty()
  public orgId: string;

  @ApiProperty()
  public memberCount: number;

  @ApiProperty()
  public createdAt: Date;
}
