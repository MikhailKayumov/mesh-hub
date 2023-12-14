import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { CgSoftEntity } from '@/database/entities/resources/cg-soft.entity';
import { CgSoftRepository } from './repositories/cg-soft.repository';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CgSoftEntity])],
  providers: [ResourcesService, CgSoftRepository],
  exports: [ResourcesService, CgSoftRepository],
  controllers: [ResourcesController],
})
export class ResourcesModule {}
