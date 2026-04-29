import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/modules/config/config.service';
import { decryptAes256, encryptAes256 } from '@/utils/encryption';

@Injectable()
export class WebhookCryptoService {
  public constructor(private readonly configService: ConfigService) {}

  public encrypt(raw: string): string {
    return encryptAes256(raw, this.configService.storageEncryptionKey);
  }

  public decrypt(cipher: string): string {
    return decryptAes256(cipher, this.configService.storageEncryptionKey);
  }

  public generateSecret(): string {
    return randomBytes(32).toString('hex');
  }
}
