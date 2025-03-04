import { Global, Module } from '@nestjs/common';
import { FilesService } from '@/modules/files/files.service';

@Global()
@Module({
  imports: [],
  providers: [FilesService],
  exports: [FilesService],
})
export class FileStorageModule {}
