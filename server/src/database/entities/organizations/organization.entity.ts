import { Column, Entity } from 'typeorm';
import { DatabaseSchemas, OrganizationsSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';

export enum PlanType {
  Starter = 'starter',
  Growth = 'growth',
  Enterprise = 'enterprise',
}

@Entity({ name: OrganizationsSchemaTables.Organization, schema: DatabaseSchemas.Organizations })
export class OrganizationEntity extends GuidIdEntityBase {
  @Column({ type: 'text', name: 'name', nullable: false })
  public name: string;

  @Column({ type: 'text', name: 'slug', unique: true, nullable: false })
  public slug: string;

  @Column({
    type: 'enum',
    enum: PlanType,
    name: 'plan_type',
    nullable: false,
    default: PlanType.Starter,
  })
  public planType: PlanType;
}
