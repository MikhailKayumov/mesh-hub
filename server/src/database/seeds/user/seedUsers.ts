import { fakerRU as faker } from '@faker-js/faker';
import { ConflictException, INestApplication, Logger } from '@nestjs/common';
import { Not } from 'typeorm';
import { UserRoles } from '@/constants';
import { RoleEntity } from '@/database/entities/user/role.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { ConfigService } from '@/modules/config/config.service';
import { UserCreateRequestDto } from '@/modules/user/dto/user.create.request.dto';
import { RoleRepository } from '@/modules/user/repositories/role.repository';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { UserService } from '@/modules/user/services/user.service';

type UserData = Array<UserCreateRequestDto & { isTest?: boolean; roleEntities?: RoleEntity[] }>;

const logger = new Logger('DatabaseSeedingUsers');

const predefinedUserData: UserData = [
  {
    email: 'mkaumov056@gmail.com',
    phone: '+79011493957',
    firstName: 'Михаил',
    middleName: 'Линарович',
    lastName: 'Каюмов',
    password: '!pass4First!',
    roles: [UserRoles.SuperUser],
    isTest: true,
  },
];
const TEST_USER_AMOUNT = 10;

export default async function seedUsers(app: INestApplication) {
  logger.log('Seed users');

  const userService = app.get(UserService);
  const userRepository = app.get(UserRepository);
  const config = app.get(ConfigService);
  const roleRepository = app.get(RoleRepository);
  const roles = await roleRepository.find({ where: { name: Not(UserRoles.SuperUser) } });

  const logUsersList = (users: UserData | Partial<UserEntity & { error?: string }>[]) => {
    return users
      .map(
        (user, index) =>
          `\t${index + 1}. "${user.firstName} ${user.lastName}" (${user.email}) - ${(user as any)?.error ?? 'Created'}`,
      )
      .join('\n');
  };

  const createUserEntity = async (user: UserData[number]): Promise<Partial<UserEntity & { error?: string }>> => {
    try {
      return await userService.createUserEntity(user);
    } catch (e) {
      let error = 'Unknown error';
      switch (true) {
        case e instanceof ConflictException:
          const response = e.getResponse() as string | { error: string; message: string };
          error = typeof response === 'string' ? response : `${response.error}: ${response.message}`;
          break;
      }

      return {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        error,
      };
    }
  };

  const predefinedUserDataFiltered = predefinedUserData.filter(
    (item) => !item.isTest || (config.isDevelopment && item.isTest),
  );
  const predefinedUserEntities = await Promise.all(predefinedUserDataFiltered.map(createUserEntity));
  const predefinedUsers = await userRepository.save(predefinedUserEntities.filter((item) => !item?.error));

  const list = predefinedUserEntities.map(
    (entity) => predefinedUsers?.find((user) => user.email === entity.email) ?? entity,
  );

  const existEmails = new Set(predefinedUsers.map(({ email }) => email));
  if (config.isDevelopment && TEST_USER_AMOUNT) {
    const testUsersEntities: Partial<UserEntity & { error?: string }>[] = [];

    for (let i = 0; i < TEST_USER_AMOUNT; i++) {
      const sexType = faker.person.sexType();
      const firstName = faker.person.firstName(sexType);
      const middleName = faker.person.middleName(sexType);

      let lastName = faker.person.lastName(sexType);
      let email = faker.internet.email({ firstName, lastName, provider: 'example.dev' });
      while (existEmails.has(email)) {
        lastName = faker.person.lastName(sexType);
        email = faker.internet.email({ firstName, lastName, provider: 'example.dev' });
      }
      existEmails.add(email);

      const userEntity = await createUserEntity({
        email,
        phone: faker.phone.number({ style: 'international' }),
        firstName,
        middleName,
        lastName,
        password: 'pass4test',
        roleEntities: faker.helpers.arrayElements(roles, { max: 2, min: 1 }),
      });

      testUsersEntities.push(userEntity);
    }

    const testUsers = await userRepository.save(testUsersEntities.filter((item) => !item?.error));
    list.push(...testUsersEntities.map((entity) => testUsers?.find((user) => user.email === entity.email) ?? entity));
  }

  if (list) {
    logger.log(`Seeding users results\n${logUsersList(list)}`);
  }
}
