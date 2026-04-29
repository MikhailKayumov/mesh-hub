import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsString, IsUrl } from 'class-validator';
import { WEBHOOK_EVENTS, WebhookEvent } from '../webhooks.constants';

export class WebhookCreateRequestDto {
  @ApiProperty({ example: 'https://example.com/hook' })
  @IsUrl({ require_tld: false })
  public url: string;

  @ApiProperty({ enum: WEBHOOK_EVENTS, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn(WEBHOOK_EVENTS, { each: true })
  public events: WebhookEvent[];
}
