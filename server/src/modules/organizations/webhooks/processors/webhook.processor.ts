import { createHmac } from 'crypto';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { WebhookDeliveryLogEntity } from '@/database/entities/organizations/webhook-delivery-log.entity';
import { WebhookDeliveryLogRepository } from '../repositories/webhook-delivery-log.repository';
import { WebhookRepository } from '../repositories/webhook.repository';
import { WebhookCryptoService } from '../services/webhook-crypto.service';
import { WEBHOOK_DELIVER_JOB, WEBHOOK_QUEUE, WebhookDeliverJobData } from '../webhooks.constants';

const REQUEST_TIMEOUT_MS = 10_000;

@Processor(WEBHOOK_QUEUE)
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  public constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly deliveryLogRepository: WebhookDeliveryLogRepository,
    private readonly cryptoService: WebhookCryptoService,
  ) {}

  @Process(WEBHOOK_DELIVER_JOB)
  public async deliver(job: Job<WebhookDeliverJobData>): Promise<void> {
    const { webhookId, event, payload } = job.data;

    const webhook = await this.webhookRepository.findOne({ where: { id: webhookId } });
    if (!webhook || !webhook.isActive) {
      this.logger.warn(`Skipping delivery for missing/inactive webhook ${webhookId}`);
      return;
    }

    // Decrypt the AES-encrypted secret first, THEN HMAC-sign with the raw secret.
    const rawSecret = this.cryptoService.decrypt(webhook.secret);
    const body = JSON.stringify({ event, payload, deliveredAt: new Date().toISOString() });
    const signature = createHmac('sha256', rawSecret).update(body).digest('hex');

    const log = new WebhookDeliveryLogEntity();
    log.webhookId = webhookId;
    log.event = event;
    log.payload = payload;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': event,
        },
        body,
        signal: controller.signal,
      });

      log.responseStatus = res.status;
      if (res.ok) {
        log.deliveredAt = new Date();
      } else {
        log.failedAt = new Date();
      }
    } catch (err) {
      this.logger.warn(`Webhook delivery failed for ${webhookId}: ${(err as Error).message}`);
      log.responseStatus = null;
      log.failedAt = new Date();
    } finally {
      clearTimeout(timer);
    }

    await this.deliveryLogRepository.save(log);

    if (log.failedAt) {
      // Throw so Bull retries per the queue's attempts/backoff config.
      throw new Error(`Webhook delivery failed (status=${log.responseStatus ?? 'no-response'})`);
    }
  }
}
