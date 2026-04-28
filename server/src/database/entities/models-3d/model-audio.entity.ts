import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { Model3dEntity } from './model-3d.entity';

@Entity({ name: Models3DSchemaTables.ModelAudio, schema: DatabaseSchemas.Models3D })
@Index(['modelId'])
export class ModelAudioEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'model_id', nullable: false })
  public modelId: string;

  @ManyToOne(() => Model3dEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;

  @Column({ type: 'varchar', name: 'filename', length: 255, nullable: false })
  public filename: string;

  @Column({ type: 'varchar', name: 'original_name', length: 255, nullable: false })
  public originalName: string;

  @Column({ type: 'float8', name: 'duration_s', nullable: true })
  public durationS?: number | null;
}
