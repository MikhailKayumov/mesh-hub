import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ConfigService } from '@config/config.service';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export class SwaggerService {
  private readonly path: string = join(process.cwd(), 'swagger.openapi3.json');

  public constructor(
    private readonly application: INestApplication,
    private readonly configService: ConfigService,
  ) {}

  public async createDocument(write = false): Promise<OpenAPIObject> {
    const config = this.buildConfig();
    const document = SwaggerModule.createDocument(this.application, config);

    if (write) {
      await writeFile(this.path, JSON.stringify(document, null, 2));
    }

    return document;
  }

  private buildConfig(): Omit<OpenAPIObject, 'paths'> {
    const { title, description, version, server } = this.configService.swagger;

    return new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .addBearerAuth()
      .addCookieAuth('x-access-token')
      .addServer(server)
      .build();
  }
}
