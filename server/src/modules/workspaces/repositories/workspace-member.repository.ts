import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMemberEntity } from '@/database/entities/workspaces/workspace-member.entity';

@Injectable()
export class WorkspaceMemberRepository extends Repository<WorkspaceMemberEntity> {
  public constructor(
    @InjectRepository(WorkspaceMemberEntity)
    private repository: Repository<WorkspaceMemberEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceMemberEntity | null> {
    return this.findOne({ where: { workspaceId, userId } });
  }

  public countByWorkspace(workspaceId: string): Promise<number> {
    return this.count({ where: { workspaceId } });
  }
}
