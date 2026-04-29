import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelAudioEntity } from '@/database/entities/models-3d/model-audio.entity';
import { FilesService } from '@/modules/files/files.service';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { ModelAudioRepository } from './model-audio.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ModelAudioEntity, Model3dEntity])],
  providers: [AudioService, FilesService, ModelAudioRepository, Model3dRepository],
  controllers: [AudioController],
  exports: [AudioService],
})
export class AudioModule {}
