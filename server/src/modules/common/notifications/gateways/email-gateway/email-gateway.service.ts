import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailGatewayService {
  private readonly logger = new Logger('EmailGatewayService');

  public constructor(private readonly mailService: MailerService) {}

  public async sendEmail(to: string | string[], subject: string, text: string): Promise<any> {
    try {
      this.logger.log({ message: 'Send email', to, subject, text });

      const result = await this.mailService.sendMail({ to, subject, text });

      this.logger.log({ message: 'Email sending result', result: JSON.stringify(result) });

      return result;
    } catch (e) {
      this.logger.error(e);

      return null;
    }
  }
}
