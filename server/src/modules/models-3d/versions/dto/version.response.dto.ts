import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VersionUploaderDto {
  @ApiProperty()
  public id: string;

  @ApiPropertyOptional()
  public firstName?: string;

  @ApiPropertyOptional()
  public lastName?: string;

  @ApiPropertyOptional()
  public avatar?: string;
}

export class VersionResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public versionNumber: number;

  @ApiProperty()
  public fileName: string;

  @ApiProperty()
  public fileSize: number;

  @ApiPropertyOptional({ nullable: true })
  public entryFile?: string | null;

  @ApiPropertyOptional({ nullable: true })
  public changeNotes: string | null;

  @ApiProperty()
  public isActive: boolean;

  @ApiProperty({ type: () => VersionUploaderDto })
  public uploader: VersionUploaderDto;

  @ApiProperty()
  public createdAt: string;
}
