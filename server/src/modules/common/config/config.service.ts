import { Injectable } from '@nestjs/common';
import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { DataSourceOptions } from 'typeorm';

export type APP_MODE = 'PRODUCTION' | 'DEVELOPMENT' | 'TEST';

@Injectable()
export class ConfigService {
  public constructor(private readonly config: NestConfigService) {}

  public get app() {
    return {
      host: this.get('APP_HOST'),
      port: this.getNumber('APP_PORT'),
      mode: this.get<APP_MODE>('APP_MODE', 'DEVELOPMENT'),
      prefix: this.get('APP_GLOBAL_PREFIX', ''),
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
        if (originsWhitelist && (originsWhitelist === '*' || originsWhitelist.split(',').includes(origin))) {
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
    const mode = this.get<APP_MODE>('APP_MODE', 'DEVELOPMENT');

    return mode === 'PRODUCTION';
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

  public get<T = string>(name: string, defaultValue?: T): T {
    return defaultValue ? this.config.get<T>(name, defaultValue) : this.config.getOrThrow(name);
  }

  public getNumber(name: string, defaultValue?: number): number {
    const value = Number(this.get<number>(name, defaultValue));
    if (isNaN(value)) {
      throw new Error(`Variable ${name} must be number`);
    }

    return value;
  }
}
