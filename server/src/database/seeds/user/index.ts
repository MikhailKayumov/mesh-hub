import { INestApplication } from '@nestjs/common';
import seedRoles from './seedRoles';
import seedUsers from './seedUsers';

// const logger = new Logger('DatabaseSeedingResources');

export default async function seedUsersData(app: INestApplication) {
  await seedRoles(app);
  await seedUsers(app);
}
