import { IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VersionUploadRequestDto {
  @ApiPropertyOptional({ description: 'Release notes for this version', maxLength: 500 })
  @IsOptional()
  @MaxLength(500)
  public changeNotes?: string;
}
