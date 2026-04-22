import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { OrgInviteEntity } from '@/database/entities/organizations/org-invite.entity';

@Injectable()
export class OrgInviteRepository extends Repository<OrgInviteEntity> {
  public constructor(
    @InjectRepository(OrgInviteEntity)
    private repository: Repository<OrgInviteEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findActiveByToken(token: string): Promise<OrgInviteEntity | null> {
    return this.findOne({
      where: {
        token,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
