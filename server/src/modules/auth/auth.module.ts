import { ConfigService } from '@config/config.service';
import { SessionEntity } from '@entities/session/session.entity';
import { AuthRepository } from '@modules/auth/auth.repository';
import { AuthStrategy } from '@modules/auth/auth.strategy';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.jwt.accessSecret,
        signOptions: {
          algorithm: config.jwt.algorithm,
          expiresIn: config.jwt.accessExpiresIn,
        },
      }),
    }),
    UserModule,
  ],
  providers: [AuthService, AuthRepository, AuthStrategy],
  exports: [AuthService, AuthRepository, AuthStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
