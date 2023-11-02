import { ConfigService } from '@config/config.service';
import { AppHttpException } from '@exceptions/app-http.exception';
import { CookiesInterceptor } from '@interceptors/cookies.interceptor';
import { LoggingInterceptor } from '@interceptors/logging.interceptor';
import { ValidationPipe, ValidationError, HttpStatus } from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { SwaggerService } from '@swagger/swagger.service';
import * as cookieParser from 'cookie-parser';
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

    this.application = await NestFactory.create(AppModule);
    this.configService = this.application.get(ConfigService);

    this.application.use(cookieParser());
    this.application.enableCors(this.configService.cors);
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
    this.application.useGlobalInterceptors(new LoggingInterceptor());
    this.application.useGlobalInterceptors(new CookiesInterceptor(this.configService));

    return this.application;
  }

  public static async runApp(): Promise<NestApplication> {
    await this.initApp();

    const swaggerService = new SwaggerService(this.application, this.configService);
    SwaggerModule.setup('swagger', this.application, await swaggerService.createDocument());

    this.application.listen(this.configService.app.port, this.configService.app.host);

    return this.application;
  }
}
