import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgMemberEntity } from '@/database/entities/organizations/org-member.entity';

@Injectable()
export class OrgMemberRepository extends Repository<OrgMemberEntity> {
  public constructor(
    @InjectRepository(OrgMemberEntity)
    private repository: Repository<OrgMemberEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findByOrgAndUser(orgId: string, userId: string): Promise<OrgMemberEntity | null> {
    return this.findOne({ where: { orgId, userId } });
  }

  public countByOrg(orgId: string): Promise<number> {
    return this.count({ where: { orgId } });
  }
}
