import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbedDomainWhitelistEntity } from '@/database/entities/embed/embed-domain-whitelist.entity';
import { EmbedProjectEntity } from '@/database/entities/embed/embed-project.entity';
import { ModelViewLogEntity } from '@/database/entities/embed/model-view-log.entity';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { EmbedController } from '@/modules/embed/controllers/embed.controller';
import { EmbedDomainWhitelistRepository } from '@/modules/embed/repositories/embed-domain-whitelist.repository';
import { EmbedProjectRepository } from '@/modules/embed/repositories/embed-project.repository';
import { ModelViewLogRepository } from '@/modules/embed/repositories/model-view-log.repository';
import { EmbedService } from '@/modules/embed/services/embed.service';
import { Models3dModule } from '@/modules/models-3d/models-3d.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmbedProjectEntity, EmbedDomainWhitelistEntity, ModelViewLogEntity]),
    ApiKeysModule,
    Models3dModule,
    OrganizationsModule,
  ],
  providers: [EmbedService, EmbedProjectRepository, EmbedDomainWhitelistRepository, ModelViewLogRepository],
  controllers: [EmbedController],
})
export class EmbedModule {}
