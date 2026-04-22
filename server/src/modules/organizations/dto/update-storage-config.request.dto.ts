import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StorageBackend } from '@/database/entities/organizations/org-subscription.entity';

export class S3StorageConfigInputDto {
  @IsString()
  public region: string;

  @IsString()
  public bucket: string;

  @IsString()
  public accessKeyId: string;

  @IsString()
  public secretAccessKey: string;

  @IsOptional()
  @IsString()
  public endpoint?: string;
}

export class UpdateStorageConfigRequestDto {
  @IsEnum(StorageBackend)
  public storageBackend: StorageBackend;

  @IsOptional()
  @ValidateNested()
  @Type(() => S3StorageConfigInputDto)
  public s3Config?: S3StorageConfigInputDto;
}
