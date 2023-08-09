import { ConfigModule } from '@config/config.module';
import { ConfigService } from '@config/config.service';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getTypeOrmOptions(),
    }),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
