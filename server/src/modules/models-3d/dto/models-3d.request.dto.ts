import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class Models3dRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public search?: string;

  @ApiPropertyOptional()
  public categories?: string[];

  @ApiPropertyOptional({ description: 'Filter models belonging to this workspace' })
  @IsOptional()
  @IsUUID()
  public workspaceId?: string;
}

export class UploadModel3dRequestDto {
  @ApiPropertyOptional({ description: 'Workspace to assign the uploaded model to' })
  @IsOptional()
  @IsUUID()
  public workspaceId?: string;
}
