import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import seedUsersData from './user';
// import seedResources from '@/database/seeds/resources';

const logger = new Logger('DatabaseSeeding');

async function run() {
  const app = await NestFactory.create(AppModule);

  logger.log('Start seeding');

  // await seedResources(app);
  await seedUsersData(app);
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
