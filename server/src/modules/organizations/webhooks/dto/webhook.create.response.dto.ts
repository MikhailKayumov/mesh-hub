import { ApiProperty } from '@nestjs/swagger';
import { WebhookResponseDto } from './webhook.response.dto';

export class WebhookCreateResponseDto extends WebhookResponseDto {
  @ApiProperty({ description: 'Raw signing secret. Shown once on creation; cannot be retrieved later.' })
  public secret: string;
}
