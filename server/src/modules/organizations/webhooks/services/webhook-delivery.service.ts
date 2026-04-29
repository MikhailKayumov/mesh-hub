import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';
import { WebhookRepository } from '../repositories/webhook.repository';
import { WEBHOOK_DELIVER_JOB, WEBHOOK_QUEUE, WebhookDeliverJobData } from '../webhooks.constants';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  public constructor(
    private readonly webhookRepository: WebhookRepository,
    @InjectQueue(WEBHOOK_QUEUE) private readonly webhookQueue: Queue<WebhookDeliverJobData>,
  ) {}

  /**
   * Enqueue a webhook delivery job for every active webhook in the org subscribed to the event.
   * Non-blocking — failures here are logged but never propagated to the caller.
   */
  public async dispatch(orgId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const webhooks = await this.webhookRepository.findActiveForEvent(orgId, event);
      if (!webhooks.length) return;

      await Promise.all(
        webhooks.map((webhook) =>
          this.webhookQueue.add(
            WEBHOOK_DELIVER_JOB,
            { webhookId: webhook.id, event, payload },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: true,
              removeOnFail: true,
            },
          ),
        ),
      );
    } catch (err) {
      this.logger.error(`Failed to enqueue webhook deliveries for org=${orgId} event=${event}`, err as Error);
    }
  }
}
