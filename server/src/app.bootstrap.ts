import { ValidationPipe, ValidationError, HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
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
  public logger: LoggerService;

  private application: NestExpressApplication;
  private configService: ConfigService;

  public get app(): NestExpressApplication {
    return this.application;
  }

  public async init(): Promise<AppBootstrap> {
    if (this.application) return this;

    this.application = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
    this.configService = this.application.get(ConfigService);
    this.logger = this.application.get(LoggerService);

    this.application.setGlobalPrefix(this.configService.app.prefix);
    this.application.set('trust proxy', 1);

    this.application.use(cookieParser());
    this.application.use(json({ limit: '100kb' }));
    this.application.use(urlencoded({ extended: true, limit: '100kb' }));

    this.application.enableCors(this.configService.cors);

    this.application.useGlobalInterceptors(new LoggingInterceptor());
    this.application.useLogger(this.application.get(LoggerService));
    this.application.enableShutdownHooks();

    this.addValidationPipe();

    return this;
  }

  public async run(): Promise<NestExpressApplication> {
    if (!this.application) {
      throw new Error(`It's immposible to run undefined Application.`);
    }

    const swaggerService = new SwaggerService(this.application, this.configService);
    SwaggerModule.setup('swagger', this.application, await swaggerService.createDocument());

    await this.application.listen(this.configService.app.port, this.configService.app.host);
    this.logger.log(`Server is running on ${this.configService.app.host}:${this.configService.app.port}`);

    return this.application;
  }

  private addValidationPipe(): void {
    this.application?.useGlobalPipes(
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
        enableDebugMessages: !this.configService?.isProduction,
      }),
    );
  }
}
