import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrgMemberRole } from '@/database/entities/organizations/org-member.entity';

export class OrgMemberRoleChangeRequestDto {
  @ApiProperty({ enum: OrgMemberRole })
  @IsEnum(OrgMemberRole)
  public role: OrgMemberRole;
}
