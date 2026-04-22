import { Column, Entity } from 'typeorm';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';

@Entity({ name: Models3DSchemaTables.Model3DFile, schema: DatabaseSchemas.Models3D })
export class Model3dFileEntity extends GuidIdEntityBase {
  @Column({ type: 'text', nullable: false })
  public name: string;

  @Column({ type: 'bigint', nullable: false })
  public size: number;

  @Column({ type: 'text', nullable: false })
  public extension: string;

  @Column({ type: 'text', nullable: true, name: 'entry_file' })
  public entryFile?: string;
}
