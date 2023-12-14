import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import seedResources from '@/database/seeds/resources/seedResources';
import seedRoles from '@/database/seeds/seedRoles';
import seedUsers from '@/database/seeds/seedUsers';
import { ConfigService } from '@/modules/common/config/config.service';

const logger = new Logger('DatabaseSeeding');

(async () => {
  try {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

    logger.log('Start seeding');

    logger.log('Seed required seeds');
    await seedRoles(app);
    await seedResources(app);

    if (!config.isProduction) {
      logger.log('Seed not required seeds');
      await seedUsers(app);
    }

    process.exit(0);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();
