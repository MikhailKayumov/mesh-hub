import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgInviteEntity } from '@/database/entities/organizations/org-invite.entity';
import { OrgMemberEntity } from '@/database/entities/organizations/org-member.entity';
import { OrgSubscriptionEntity } from '@/database/entities/organizations/org-subscription.entity';
import { OrganizationEntity } from '@/database/entities/organizations/organization.entity';
import { OrganizationController } from '@/modules/organizations/controllers/organization.controller';
import { OrgMemberGuard } from '@/modules/organizations/guards/org-member.guard';
import { OrgInviteRepository } from '@/modules/organizations/repositories/org-invite.repository';
import { OrgMemberRepository } from '@/modules/organizations/repositories/org-member.repository';
import { OrganizationRepository } from '@/modules/organizations/repositories/organization.repository';
import { OrganizationService } from '@/modules/organizations/services/organization.service';
import { StorageQuotaModule } from '@/modules/storage-quota/storage-quota.module';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationEntity, OrgMemberEntity, OrgSubscriptionEntity, OrgInviteEntity]),
    UserModule,
    StorageQuotaModule,
  ],
  providers: [OrganizationRepository, OrgMemberRepository, OrgInviteRepository, OrganizationService, OrgMemberGuard],
  exports: [OrganizationService, OrgMemberRepository],
  controllers: [OrganizationController],
})
export class OrganizationsModule {}
