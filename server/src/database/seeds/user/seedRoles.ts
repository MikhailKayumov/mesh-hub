import { INestApplication, Logger } from '@nestjs/common';
import { UserRoles, UserRolesDescriptions } from '@/constants';
import { RoleEntity } from '@/database/entities/user/role.entity';
import { RoleRepository } from '@/modules/user/repositories/role.repository';

const logger = new Logger('DatabaseSeedingRoles');

export default async function seedRoles(app: INestApplication) {
  logger.log('Seed roles');

  const roleRepository = app.get(RoleRepository);
  const names = Object.values(UserRoles);
  const existRoles = new Set((await roleRepository.getByNames(names)).map(({ name }) => name));
  const notExistRoles: RoleEntity[] = names.reduce<RoleEntity[]>((acc, name) => {
    if (!existRoles.has(name)) {
      const role = new RoleEntity();
      role.name = name;
      role.description = UserRolesDescriptions[name];
      acc.push(role);
    }

    return acc;
  }, []);

  if (existRoles.size) {
    logger.log(
      `Roles ${Array.from(existRoles)
        .map((r) => `"${r}"`)
        .join(', ')} already exist`,
    );
  }

  if (!notExistRoles.length) {
    logger.log('There is no any role to create');
    return;
  }

  const res = await roleRepository.save(notExistRoles);
  logger.log(`Roles ${res.map(({ name }) => `"${name}"`).join(', ')} were successfully created`);
}
