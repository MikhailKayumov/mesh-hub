import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { UserResetPasswordEntity } from '@/database/entities/user/user-reset-password.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { UserResetPasswordRepository } from './repositories/user-reset-password.repository';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserResetPasswordEntity])],
  providers: [UserService, UserRepository, UserResetPasswordRepository],
  exports: [UserService, UserRepository, UserResetPasswordRepository],
  controllers: [UserController],
})
export class UserModule {}
