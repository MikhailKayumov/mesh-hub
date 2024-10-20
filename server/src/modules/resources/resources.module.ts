import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { CategoryEntity } from '@/database/entities/resources/category.entity';
import { CgSoftEntity } from '@/database/entities/resources/cg-soft.entity';
import { CategoryRepository } from './repositories/category.repository';
import { CgSoftRepository } from './repositories/cg-soft.repository';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CgSoftEntity, CategoryEntity])],
  providers: [ResourcesService, CgSoftRepository, CategoryRepository],
  exports: [ResourcesService, CgSoftRepository, CategoryRepository],
  controllers: [ResourcesController],
})
export class ResourcesModule {}
