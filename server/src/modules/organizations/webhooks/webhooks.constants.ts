export const WEBHOOK_QUEUE = 'webhooks';
export const WEBHOOK_DELIVER_JOB = 'deliver';

export const WEBHOOK_EVENTS = ['model.uploaded', 'comment.added', 'scene.created'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookDeliverJobData {
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
}
