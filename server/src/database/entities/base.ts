import {
  BaseEntity as TypeOrmBaseEntity,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity extends TypeOrmBaseEntity {
  public constructor() {
    super();
    this.createdAt = new Date();
  }

  abstract id: string | number;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at', nullable: false })
  public readonly createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', name: 'deleted_at', nullable: true })
  public deletedAt?: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at', nullable: true })
  public updatedAt?: Date;
}

export abstract class IntIdBaseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  public readonly id: number;
}

export abstract class GuidIdEntityBase extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public readonly id: string;
}
