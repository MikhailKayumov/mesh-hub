import { join } from 'path';
import { ValidationPipe, ValidationError, HttpStatus } from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppHttpException } from '@/exceptions/app-http.exception';
import { LoggingInterceptor } from '@/interceptors/logging.interceptor';
import { ConfigService } from '@/modules/common/config/config.service';
import { LoggerService } from '@/modules/common/logger/logger.service';
import { SwaggerService } from '@/swagger/swagger.service';
import { AppModule } from './app.module';

export default class AppBootstrap {
  private static application: NestApplication;
  private static configService: ConfigService;

  public static get app(): NestApplication {
    return this.application;
  }

  public static async initApp(): Promise<NestApplication> {
    if (this.application) {
      return this.application;
    }

    this.application = await NestFactory.create(AppModule, { bufferLogs: true });
    this.configService = this.application.get(ConfigService);

    this.application.use(cookieParser());
    this.application.enableCors(this.configService.cors);
    this.application.use(json({ limit: '5mb' }));
    this.application.use(urlencoded({ extended: true, limit: '5mb' }));

    this.application.setGlobalPrefix(this.configService.app.prefix);
    this.application.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        exceptionFactory: (errors: ValidationError[]) => {
          return new AppHttpException({
            error: 'Bad Request',
            type: 'ValidationError',
            status: HttpStatus.BAD_REQUEST,
            message: 'Ошибка валидации',
            data: errors.map((error) => ({
              property: error.property,
              errors: error.constraints ? Object.values(error.constraints) : [],
            })),
          });
        },
        enableDebugMessages: !this.configService.isProduction,
      }),
    );

    this.application.useStaticAssets(join(process.cwd(), 'files'), {
      maxAge: '1000',
      index: false,
    });

    this.application.useGlobalInterceptors(new LoggingInterceptor());
    this.application.useLogger(this.application.get(LoggerService));

    return this.application;
  }

  public static async runApp(): Promise<NestApplication> {
    await this.initApp();

    const swaggerService = new SwaggerService(this.application, this.configService);
    SwaggerModule.setup('swagger', this.application, await swaggerService.createDocument(true));

    this.application.listen(this.configService.app.port, this.configService.app.host);

    return this.application;
  }
}
