import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { OrgMemberRole } from '@/database/entities/organizations/org-member.entity';

export class OrgInviteCreateRequestDto {
  @ApiProperty()
  @IsEmail()
  public email: string;

  @ApiProperty({ enum: OrgMemberRole })
  @IsEnum(OrgMemberRole)
  public role: OrgMemberRole;
}
