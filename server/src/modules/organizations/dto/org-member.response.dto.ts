import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgMemberRole } from '@/database/entities/organizations/org-member.entity';

export class OrgMemberResponseDto {
  @ApiProperty()
  public userId: string;

  @ApiProperty()
  public email: string;

  @ApiPropertyOptional()
  public firstName?: string;

  @ApiPropertyOptional()
  public lastName?: string;

  @ApiProperty({ enum: OrgMemberRole })
  public role: OrgMemberRole;

  @ApiProperty()
  public joinedAt: Date;
}
