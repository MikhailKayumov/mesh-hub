import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMemberEntity } from '@/database/entities/workspaces/workspace-member.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { WorkspaceController } from '@/modules/workspaces/controllers/workspace.controller';
import { WorkspaceMemberRepository } from '@/modules/workspaces/repositories/workspace-member.repository';
import { WorkspaceRepository } from '@/modules/workspaces/repositories/workspace.repository';
import { WorkspaceService } from '@/modules/workspaces/services/workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity, WorkspaceMemberEntity]), OrganizationsModule],
  providers: [WorkspaceRepository, WorkspaceMemberRepository, WorkspaceService],
  exports: [WorkspaceService, WorkspaceMemberRepository],
  controllers: [WorkspaceController],
})
export class WorkspacesModule {}
