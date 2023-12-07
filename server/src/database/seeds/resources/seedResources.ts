import { INestApplication, Logger } from '@nestjs/common';
import seedCGSoft from '@/database/seeds/resources/seedCGSoft';

const logger = new Logger('DatabaseSeedingResources');

export default async function seedResources(app: INestApplication) {
  logger.log('Seed resources');

  await seedCGSoft(app);

  return null;
}
