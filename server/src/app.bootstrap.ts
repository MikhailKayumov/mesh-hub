import { ConfigService } from '@config/config.service';
import { ValidationPipe } from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
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

    return this.application;
  }

  public static async runApp(): Promise<NestApplication> {
    await this.initApp();

    this.application.enableCors(this.configService.cors);
    this.application.setGlobalPrefix(this.configService.app.prefix);

    this.application.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        enableDebugMessages: !this.configService.isProduction,
      }),
    );

    this.application.listen(this.configService.app.port, this.configService.app.host);

    return this.application;
  }
}
