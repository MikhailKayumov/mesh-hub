import { HttpStatus, Injectable } from '@nestjs/common';
import { WebhookEntity } from '@/database/entities/organizations/webhook.entity';
import { AppHttpException } from '@/exceptions/app-http.exception';
import { WebhookDeliveryLogResponseDto } from '../dto/webhook-delivery-log.response.dto';
import { WebhookCreateRequestDto } from '../dto/webhook.create.request.dto';
import { WebhookCreateResponseDto } from '../dto/webhook.create.response.dto';
import { WebhookResponseDto } from '../dto/webhook.response.dto';
import { WebhookDeliveryLogMapper } from '../mappers/webhook-delivery-log.mapper';
import { WebhookMapper } from '../mappers/webhook.mapper';
import { WebhookDeliveryLogRepository } from '../repositories/webhook-delivery-log.repository';
import { WebhookRepository } from '../repositories/webhook.repository';
import { WebhookCryptoService } from './webhook-crypto.service';

@Injectable()
export class WebhooksService {
  public constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly deliveryLogRepository: WebhookDeliveryLogRepository,
    private readonly cryptoService: WebhookCryptoService,
  ) {}

  public async create(orgId: string, dto: WebhookCreateRequestDto): Promise<WebhookCreateResponseDto> {
    const rawSecret = this.cryptoService.generateSecret();
    const encryptedSecret = this.cryptoService.encrypt(rawSecret);

    const webhook = new WebhookEntity();
    webhook.orgId = orgId;
    webhook.url = dto.url;
    webhook.events = dto.events;
    webhook.secret = encryptedSecret;
    webhook.isActive = true;

    const saved = await this.webhookRepository.save(webhook);
    return WebhookMapper.toCreateResponse(saved, rawSecret);
  }

  public async list(orgId: string): Promise<WebhookResponseDto[]> {
    const items = await this.webhookRepository.listForOrg(orgId);
    return items.map(WebhookMapper.toResponse);
  }

  public async revoke(orgId: string, webhookId: string): Promise<void> {
    const webhook = await this.webhookRepository.findOneForOrg(orgId, webhookId);
    if (!webhook) {
      throw new AppHttpException('Webhook not found', HttpStatus.NOT_FOUND);
    }
    await this.webhookRepository.softDelete({ id: webhookId });
  }

  public async getDeliveryLog(orgId: string, webhookId: string, limit = 20): Promise<WebhookDeliveryLogResponseDto[]> {
    const webhook = await this.webhookRepository.findOneForOrg(orgId, webhookId);
    if (!webhook) {
      throw new AppHttpException('Webhook not found', HttpStatus.NOT_FOUND);
    }
    const logs = await this.deliveryLogRepository.listForWebhook(webhookId, limit);
    return logs.map(WebhookDeliveryLogMapper.toResponse);
  }
}
