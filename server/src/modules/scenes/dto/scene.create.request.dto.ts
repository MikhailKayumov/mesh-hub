import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SceneCreateRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  public workspaceId?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  public description?: string;
}
