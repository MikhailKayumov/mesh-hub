import { INestApplication, Logger } from '@nestjs/common';
import { UserRoles, UserRolesDescriptions } from '@/constants';
import { RoleRepository } from '@/modules/user/repositories/role.repository';

const logger = new Logger('DatabaseSeedingRoles');

export default async function seedRoles(app: INestApplication) {
  logger.log('Seed roles');

  const roleRepository = app.get(RoleRepository);

  for (const role of Object.values(UserRoles)) {
    logger.log(`Create role "${role}"`);
    const isExist = await roleRepository.getByName(role);
    if (isExist) {
      logger.log(`Role "${role}" already exist`);
      continue;
    }

    logger.log(`Role "${role}" successfully created`);
    await roleRepository.createRole(role, UserRolesDescriptions[role]);
  }
}
