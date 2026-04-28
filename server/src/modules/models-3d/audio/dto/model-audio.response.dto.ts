import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModelAudioResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public modelId: string;

  @ApiProperty()
  public filename: string;

  @ApiProperty()
  public originalName: string;

  @ApiPropertyOptional({ nullable: true })
  public durationS?: number | null;

  @ApiProperty()
  public createdAt: Date;
}
