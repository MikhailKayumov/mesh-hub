import { Entity, Column } from 'typeorm';
import { DatabaseSchemas, ResourcesSchemaTables } from '@/database/constants';
import { IntIdBaseEntity } from '@/database/entities/base';

@Entity({ name: ResourcesSchemaTables.Category, schema: DatabaseSchemas.Resources })
export class CategoryEntity extends IntIdBaseEntity {
  @Column({ type: 'text', unique: true, nullable: false })
  public name: string;

  @Column({ type: 'text', nullable: true })
  public description?: string;
}
