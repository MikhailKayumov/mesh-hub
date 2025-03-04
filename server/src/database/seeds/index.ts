import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import seedUsersData from './user';
// import seedResources from '@/database/seeds/resources';

const logger = new Logger('DatabaseSeeding');

(async () => {
  try {
    const app = await NestFactory.create(AppModule);

    logger.log('Start seeding');

    // await seedResources(app);
    await seedUsersData(app);

    process.exit(0);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();
