import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength, IsOptional } from 'class-validator';

export class SceneCreateRequestDto {
  @ApiProperty()
  @IsUUID()
  public workspaceId: string;

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
