import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UserRoles } from '@/constants';
import {
  OrgMemberEntity,
  OrgMemberRole as OrgMemberRoleEnum,
} from '@/database/entities/organizations/org-member.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { PaginatedRequest, PaginatedResponse, PaginationDto, PaginationResponseDto } from '@/decorators/pagination';
import { User } from '@/decorators/user/user.decorator';
import { OrgInviteCreateRequestDto } from '@/modules/organizations/dto/org-invite.create.request.dto';
import { OrgMemberRoleChangeRequestDto } from '@/modules/organizations/dto/org-member-role.change.request.dto';
import { OrgMemberResponseDto } from '@/modules/organizations/dto/org-member.response.dto';
import { OrganizationCreateRequestDto } from '@/modules/organizations/dto/organization.create.request.dto';
import { OrganizationResponseDto } from '@/modules/organizations/dto/organization.response.dto';
import { OrganizationUpdateRequestDto } from '@/modules/organizations/dto/organization.update.request.dto';
import { OrgMemberRole } from '@/modules/organizations/guards/org-member-role.decorator';
import { OrganizationService } from '@/modules/organizations/services/organization.service';

@Controller('organizations')
@ApiTags('organizations')
export class OrganizationController {
  public constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  @ApiConflictResponse({ description: 'Slug already taken' })
  public createOrganization(
    @User() user: UserEntity,
    @Body() body: OrganizationCreateRequestDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationService.createOrganization(user, body);
  }

  @Get('current')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: OrganizationResponseDto, isArray: true })
  public getCurrentUserOrganizations(@User() user: UserEntity): Promise<OrganizationResponseDto[]> {
    return this.organizationService.getCurrentUserOrganizations(user);
  }

  /**
   * IMPORTANT: this static route must be declared BEFORE /:id to prevent Express
   * from treating "invite" as an :id parameter.
   */
  @Post('invite/accept')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Invite accepted' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid or expired token, or user not registered' })
  @ApiConflictResponse({ description: 'Already a member' })
  public acceptInvite(@Query('token') token: string): Promise<void> {
    return this.organizationService.acceptInvite(token);
  }

  @Get(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiForbiddenResponse({ description: 'Not a member' })
  @ApiNotFoundResponse()
  public getOrganization(
    @Param('id', ParseUUIDPipe) orgId: string,
    @User() user: UserEntity,
  ): Promise<OrganizationResponseDto> {
    return this.organizationService.getOrganization(orgId, user);
  }

  @Patch(':id')
  @OrgMemberRole(OrgMemberRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient org role' })
  @ApiNotFoundResponse()
  public updateOrganization(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Body() body: OrganizationUpdateRequestDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationService.updateOrganization(orgId, body);
  }

  @Get(':id/members')
  @OrgMemberRole(OrgMemberRoleEnum.Viewer)
  @HttpCode(HttpStatus.OK)
  @PaginatedResponse(OrgMemberResponseDto)
  @ApiForbiddenResponse({ description: 'Insufficient org role' })
  public getMembers(
    @Param('id', ParseUUIDPipe) orgId: string,
    @PaginatedRequest() pagination: PaginationDto,
  ): Promise<PaginationResponseDto<OrgMemberResponseDto>> {
    return this.organizationService.getMembers(orgId, pagination);
  }

  @Post(':id/invite')
  @OrgMemberRole(OrgMemberRoleEnum.Admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Invite sent' })
  @ApiForbiddenResponse({ description: 'Insufficient org role' })
  @ApiConflictResponse({ description: 'Seat limit reached or already a member' })
  public inviteMember(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Body() body: OrgInviteCreateRequestDto,
  ): Promise<void> {
    return this.organizationService.inviteMember(orgId, body);
  }

  @Patch(':id/members/:userId')
  @OrgMemberRole(OrgMemberRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Role updated' })
  @ApiForbiddenResponse({ description: 'Insufficient org role' })
  @ApiNotFoundResponse({ description: 'Member not found' })
  public changeMemberRole(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() body: OrgMemberRoleChangeRequestDto,
    @Req() req: Request,
  ): Promise<void> {
    return this.organizationService.changeMemberRole(orgId, req.orgMember as OrgMemberEntity, targetUserId, body.role);
  }

  @Delete(':id/members/:userId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Member removed' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Member not found' })
  public removeMember(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.organizationService.removeMember(orgId, user, targetUserId);
  }
}
