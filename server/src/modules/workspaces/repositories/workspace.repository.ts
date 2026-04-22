import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';

@Injectable()
export class WorkspaceRepository extends Repository<WorkspaceEntity> {
  public constructor(
    @InjectRepository(WorkspaceEntity)
    private repository: Repository<WorkspaceEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
