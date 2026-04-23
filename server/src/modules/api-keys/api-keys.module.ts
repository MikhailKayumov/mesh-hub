import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyEntity } from '@/database/entities/embed/api-key.entity';
import { ApiKeyController } from '@/modules/api-keys/controllers/api-key.controller';
import { ApiKeyGuard } from '@/modules/api-keys/guards/api-key.guard';
import { ApiKeyRepository } from '@/modules/api-keys/repositories/api-key.repository';
import { ApiKeyService } from '@/modules/api-keys/services/api-key.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity])],
  providers: [ApiKeyRepository, ApiKeyService, ApiKeyGuard],
  exports: [ApiKeyGuard, ApiKeyRepository],
  controllers: [ApiKeyController],
})
export class ApiKeysModule {}
