import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { WorkspaceMemberRole } from '@/database/entities/workspaces/workspace-member.entity';

export class WorkspaceMemberAddRequestDto {
  @ApiProperty()
  @IsUUID()
  public userId: string;

  @ApiProperty({ enum: WorkspaceMemberRole })
  @IsEnum(WorkspaceMemberRole)
  public role: WorkspaceMemberRole;
}
