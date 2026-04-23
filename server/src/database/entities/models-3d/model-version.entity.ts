import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Model3dEntity } from './model-3d.entity';

@Index(['modelId'])
@Entity({ name: Models3DSchemaTables.ModelVersion, schema: DatabaseSchemas.Models3D })
export class ModelVersionEntity extends GuidIdEntityBase {
  @Column({ type: 'int', name: 'version_number', nullable: false, default: 1 })
  public versionNumber: number;

  @Column({ type: 'text', name: 'file_name', nullable: false })
  public fileName: string;

  @Column({ type: 'bigint', name: 'file_size', nullable: false })
  public fileSize: number;

  @Column({ type: 'text', name: 'mime_type', nullable: false })
  public mimeType: string;

  @Column({ type: 'text', name: 'entry_file', nullable: true })
  public entryFile?: string;

  @Column({ type: 'varchar', name: 'change_notes', length: 500, nullable: true })
  public changeNotes?: string;

  @Column({ type: 'boolean', name: 'is_active', nullable: false, default: false })
  public isActive: boolean;

  @Column({ type: 'uuid', name: 'model_id', nullable: false })
  public modelId: string;

  @ManyToOne(() => Model3dEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;

  @Column({ type: 'uuid', name: 'uploader_id', nullable: false })
  public uploaderId: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploader_id' })
  public uploader: UserEntity;
}
