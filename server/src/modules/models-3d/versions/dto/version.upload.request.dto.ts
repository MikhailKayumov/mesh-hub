import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';

export class VersionUploadRequestDto {
  @ApiPropertyOptional({ description: 'Release notes for this version', maxLength: 500 })
  @IsOptional()
  @MaxLength(500)
  public changeNotes?: string;
}
