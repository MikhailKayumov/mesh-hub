import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { RoleEntity } from '@/database/entities/user/role.entity';
import { UserMetaEntity } from '@/database/entities/user/user-meta.entity';
import { UserResetPasswordEntity } from '@/database/entities/user/user-reset-password.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { AdminController } from '@/modules/user/controllers/admin.controller';
import { RoleRepository } from '@/modules/user/repositories/role.repository';
import { UserMetaRepository } from '@/modules/user/repositories/user-meta.repository';
import { UserController } from './controllers/user.controller';
import { UserResetPasswordRepository } from './repositories/user-reset-password.repository';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity, //
      UserResetPasswordEntity,
      UserMetaEntity,
      RoleEntity,
    ]),
  ],
  providers: [
    UserService, //
    UserRepository,
    UserResetPasswordRepository,
    UserMetaRepository,
    RoleRepository,
  ],
  exports: [
    UserService, //
    UserRepository,
    UserResetPasswordRepository,
    UserMetaRepository,
    RoleRepository,
  ],
  controllers: [
    UserController, //
    AdminController,
  ],
})
export class UserModule {}
