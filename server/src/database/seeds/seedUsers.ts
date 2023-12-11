import { INestApplication, Logger } from '@nestjs/common';
import { UserRoles } from '@/constants';
import { UserCreateRequestDto } from '@/modules/user/dto/user.create.request.dto';
import { UserService } from '@/modules/user/services/user.service';

const logger = new Logger('DatabaseSeedingUsers');

const data: UserCreateRequestDto[] = [
  {
    email: 'mkaumov056@gmail.com',
    phone: '+79011493957',
    firstName: 'Михаил',
    middleName: 'Линарович',
    lastName: 'Каюмов',
    password: '!pass4First!',
    roles: [UserRoles.SuperUser, UserRoles.Admin, UserRoles.User],
  },
  {
    email: 'mkayumov@softmedialab.com',
    phone: '+79920009895',
    firstName: 'Михаил',
    middleName: 'Линарович',
    lastName: 'Каюмов',
    password: '!pass4First!',
    roles: [UserRoles.Admin, UserRoles.User],
  },
];

export default async function seedUsers(app: INestApplication) {
  logger.log('Seed users');

  const userService = app.get(UserService);

  for (const user of data) {
    try {
      logger.log(`Create user "${user.firstName} ${user.lastName}" (${user.email})`);
      await userService.createUserEntity(user);
      logger.log(`User "${user.firstName} ${user.lastName}" successfully created`);
    } catch (e) {
      logger.log(e);
    }
  }
}
