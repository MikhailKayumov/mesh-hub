import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, EmbedSchemaTables } from '@/database/constants';
import { IntIdBaseEntity } from '@/database/entities/base';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { EmbedProjectEntity } from './embed-project.entity';

@Index(['modelId'])
@Index(['embedProjectId'])
@Entity({ name: EmbedSchemaTables.ModelViewLog, schema: DatabaseSchemas.Embed })
export class ModelViewLogEntity extends IntIdBaseEntity {
  @Column({ type: 'text', name: 'origin', nullable: true })
  public origin: string | null;

  @Column({ type: 'integer', name: 'duration_seconds', nullable: true })
  public durationSeconds: number | null;

  @Column({ type: 'uuid', name: 'model_id', nullable: false })
  public modelId: string;

  @ManyToOne(() => Model3dEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;

  @Column({ type: 'uuid', name: 'embed_project_id', nullable: true })
  public embedProjectId: string | null;

  @ManyToOne(() => EmbedProjectEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'embed_project_id' })
  public embedProject: EmbedProjectEntity | null;
}
