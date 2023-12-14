import { Global, Module } from '@nestjs/common';
import { FileStorageService } from '@/modules/common/files/file-storage.service';

@Global()
@Module({
  imports: [],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
