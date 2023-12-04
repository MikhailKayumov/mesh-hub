import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { ConfigService } from '@/modules/common/config/config.service';
import { UserModule } from '@/modules/user/user.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { JwtAuthStrategy } from './strategies/jwt-auth.strategy';

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
  providers: [AuthService, AuthRepository, JwtAuthStrategy],
  exports: [AuthService, AuthRepository, JwtAuthStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
