import { Injectable } from '@nestjs/common';
import { EmailGatewayService } from './gateways/email-gateway/email-gateway.service';

@Injectable()
export class NotificationsService {
  public constructor(private readonly emailGatewayService: EmailGatewayService) {}

  public async sendEmail(to: string | string[], subject: string, text: string): Promise<any> {
    if ((Array.isArray(to) && !to.length) || !to) {
      return;
    }

    return await this.emailGatewayService.sendEmail(to, subject, text);
  }

  // public async checkSmsCode(phone: string, smsCode: string, type: SmsCodeType): Promise<void> {
  //   const notExpiredSmsCode = await this.smsCodeRepository.getActiveByPhone(phone, type);
  //   if (!notExpiredSmsCode) {
  //     throw new HttpException('Код указан не верно', HttpStatus.BAD_REQUEST);
  //   }
  //   if (notExpiredSmsCode.code !== smsCode) {
  //     notExpiredSmsCode.attemptCount += 1;
  //     await this.smsCodeRepository.save(notExpiredSmsCode);
  //     throw new HttpException('Код указан не верно', HttpStatus.BAD_REQUEST);
  //   }
  //   await this.smsCodeRepository.softDelete(notExpiredSmsCode.id);
  // }
  //
  // public async getActiveSmsCode(phone: string, type: SmsCodeType): Promise<SmsCodeEntity> {
  //   return this.smsCodeRepository.getActiveByPhone(phone, type);
  // }
  //
  // public async createOrUpdateSmsCode(phone: string, ip: string, type: SmsCodeType): Promise<SmsCodeEntity> {
  //   const notExpiredSmsCode = await this.smsCodeRepository.getActiveByPhone(phone, type);
  //   let smsCode: SmsCodeEntity = new SmsCodeEntity();
  //
  //   if (!notExpiredSmsCode) {
  //     smsCode = new SmsCodeEntity();
  //     smsCode.phone = phone;
  //     smsCode.attemptCount = 0;
  //   } else {
  //     if (addSeconds(notExpiredSmsCode.createdAt, configService.getAuthConfig().smsCodeRepeatSeconds) >= new Date()) {
  //       throw new HttpException('Действие старого СМС кода еще не истекло', HttpStatus.BAD_REQUEST);
  //     }
  //     smsCode = notExpiredSmsCode;
  //     smsCode.attemptCount += 1;
  //   }
  //
  //   smsCode.ip = ip;
  //   smsCode.type = type;
  //   smsCode.code = RandomHelper.generateSmsCode();
  //   smsCode.expiredAt = addSeconds(new Date(), configService.getAuthConfig().smsCodeExpireSeconds);
  //   await this.smsGatewayService.sendSms(smsCode.phone, smsCode.code);
  //
  //   smsCode = await this.smsCodeRepository.save(smsCode);
  //
  //   return smsCode;
  // }
  //
  // public async deleteActiveSmsCode(id: string): Promise<void> {
  //   await this.smsCodeRepository.update({ id }, { deletedAt: new Date() });
  // }
  //
  // public async checkIpSmsCodeDDOS(ip: string): Promise<void> {
  //   const qb = this.smsCodeRepository.createQueryBuilder('sms');
  //
  //   qb.where({
  //     ip,
  //     deletedAt: IsNull(),
  //     updatedAt: MoreThanOrEqual(subHours(new Date(), 1)),
  //   });
  //
  //   const smsCodes = await qb.getMany();
  //
  //   const count = smsCodes.reduce((prev, current) => {
  //     return prev + current.attemptCount;
  //   }, 0);
  //
  //   const maxAttemptCount = configService.getAuthConfig().smsMaxRetryPerTime;
  //
  //   if (count >= maxAttemptCount) {
  //     throw new HttpException('Слишком много запросов с вашего ip', HttpStatus.TOO_MANY_REQUESTS);
  //   }
  // }
}
