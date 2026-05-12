import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import ContentSeedModule from './content';
import ResourcesSeedModule from './resources';
import { SeedModule } from './type';
import UsersSeedModule from './user';

const logger = new Logger('DatabaseSeeding');

const Modules: SeedModule[] = [ResourcesSeedModule, UsersSeedModule, ContentSeedModule];

async function run() {
  const app = await NestFactory.create(AppModule);

  logger.log('Start seeding...');

  for (const module of Modules) {
    const { name, seeds, dev } = module;

    logger.log(`Seeding ${name} module...`);

    for (const seed of seeds) {
      await seed(app);
    }

    for (const seed of dev ?? []) {
      await seed(app);
    }
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
