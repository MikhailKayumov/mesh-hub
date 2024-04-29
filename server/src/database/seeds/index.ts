import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import seedResources from '@/database/seeds/resources/seedResources';
import seedRoles from '@/database/seeds/seedRoles';
import seedUsers from '@/database/seeds/seedUsers';

const logger = new Logger('DatabaseSeeding');

(async () => {
  try {
    const app = await NestFactory.create(AppModule);

    logger.log('Start seeding');

    logger.log('Seed roles');
    await seedRoles(app);

    logger.log('Seed resources');
    await seedResources(app);

    logger.log('Seed users');
    await seedUsers(app);

    process.exit(0);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();
