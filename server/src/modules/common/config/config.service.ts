import { resolve } from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { MailerOptions } from '@nestjs-modules/mailer';
import { Algorithm } from 'jsonwebtoken';
import { DataSourceOptions } from 'typeorm';
import { isNil } from '@/utils';
import { TypeOrmNamingStrategy } from './typeorm-naming-strategy';

export type APP_MODE = 'PRODUCTION' | 'DEVELOPMENT' | 'TEST';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger('ConfigService');

  public constructor(private readonly config: NestConfigService) {}

  public get app() {
    return {
      host: this.get('APP_HOST'),
      port: this.getNumber('APP_PORT'),
      mode: this.get<APP_MODE>('APP_MODE', 'DEVELOPMENT'),
      prefix: this.get('APP_GLOBAL_PREFIX', ''),
      frontendUrl: this.get('APP_FRONTEND_URL'),
    };
  }

  public get jwt() {
    return {
      cookieName: this.get('AUTH_JWT_COOKIE_NAME'),
      algorithm: 'HS512' as Algorithm,
      accessSecret: this.get('AUTH_JWT_ACCESS_SECRET'),
      refreshSecret: this.get('AUTH_JWT_REFRESH_SECRET'),
      accessExpiresIn: this.getNumber('AUTH_JWT_ACCESS_EXPIRES'),
      refreshExpiresIn: this.getNumber('AUTH_JWT_REFRESH_EXPIRES'),
    };
  }

  public get cors(): CorsOptions {
    return {
      origin: (origin, callback) => {
        const originsWhitelist = this.get<string>('CORS_ORIGINS_WHITE_LIST', '*');

        let originResult: boolean | string = false;
        if (originsWhitelist === '*' || originsWhitelist.split(',').includes(origin)) {
          originResult = origin;
        }

        callback(null, originResult);
      },
      credentials: true,
      maxAge: 86400,
      exposedHeaders: ['Resource-Version', 'Web-Client-Version'],
      allowedHeaders: [
        'Content-Type',
        'x-access-token',
        'Resource-Version',
        'Web-Client-Version',
        'ppm-identificator',
        'accept-language',
      ],
    };
  }

  public get isProduction() {
    return this.get<APP_MODE>('APP_MODE', 'DEVELOPMENT') === 'PRODUCTION';
  }

  public get isDevelopment() {
    return this.get<APP_MODE>('APP_MODE', 'DEVELOPMENT') === 'DEVELOPMENT';
  }

  public get isTest() {
    return this.get<APP_MODE>('APP_MODE', 'DEVELOPMENT') === 'TEST';
  }

  public get typeOrmOptions(): DataSourceOptions {
    return {
      type: 'postgres',
      host: this.get('POSTGRES_HOST'),
      port: this.get<number>('POSTGRES_PORT'),
      username: this.get('POSTGRES_USER'),
      password: this.get('POSTGRES_PASSWORD'),
      database: this.get('POSTGRES_DB'),
      ssl: this.isProduction,
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/database/migrations/**/*.js'],
      namingStrategy: new TypeOrmNamingStrategy(),
    };
  }

  public get throttlerConfig(): ThrottlerModuleOptions {
    if (this.isTest) return { throttlers: [] };

    return {
      throttlers: [
        {
          ttl: +this.getNumber('THROTTLE_GLOBAL_TTL', 60),
          limit: +this.getNumber('THROTTLE_GLOBAL_LIMIT', 10),
        },
      ],
    };
  }

  public get swagger() {
    return {
      title: this.get('SWAGGER_TITLE', 'MeshHub Swagger'),
      description: this.get('SWAGGER_DESCRIPTION', 'The mesh hub API description'),
      version: this.get('SWAGGER_VERSION', '1.0'),
      server: this.get('SWAGGER_SERVER', 'http://localhost:8080'),
    };
  }

  public get logging() {
    return {
      level: this.get('LOGS_LEVEL', 'silly'),
      fileLoggingEnabled: this.getBoolean('LOGS_TO_FILE_ENABLED', false),
    };
  }

  public get mailerConfig(): MailerOptions {
    const enabled = this.getBoolean('SMTP_YANDEX_ENABLED', false);

    const name = this.get('SMTP_YANDEX_SENDER_NAME', !enabled ? '' : undefined);
    const user = this.get('SMTP_YANDEX_AUTH_USER', !enabled ? '' : undefined);
    const pass = this.get('SMTP_YANDEX_AUTH_PASS', !enabled ? '' : undefined);

    return {
      transport: {
        host: this.get('SMTP_YANDEX_HOST', 'smtp.yandex.ru'),
        secure: true,
        port: this.getNumber('SMTP_YANDEX_PORT', 465),
        auth: { user, pass },
        jsonTransport: !enabled || undefined,
      },
      defaults: {
        from: `"${name}" <${user}>`,
      },
    };
  }

  public get fsConfig() {
    const root = resolve(process.cwd(), 'files');

    return {
      root,
      folders: {
        avatars: resolve(root, 'avatars'),
        models: resolve(root, 'models-3d'),
      },
    };
  }

  public get<T = string>(name: string, defaultValue?: T): T {
    return !isNil(defaultValue) ? this.config.get<T>(name, defaultValue) : this.config.getOrThrow(name);
  }

  public getNumber(name: string, defaultValue?: number): number {
    const value = Number(this.get<number>(name, defaultValue));
    if (isNaN(value)) {
      throw new Error(`Variable ${name} must be number`);
    }

    return value;
  }

  public getBoolean(name: string, defaultValue?: boolean): boolean {
    const value = this.get<string>(name, '');
    if (!value && typeof defaultValue !== 'boolean') {
      throw new Error(`Variable ${name} must be boolean`);
    }

    return value ? ['1', 'true', 'on'].includes(value) : defaultValue!;
  }
}
