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
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { WorkspaceMemberAddRequestDto } from '@/modules/workspaces/dto/workspace-member.add.request.dto';
import { WorkspaceCreateRequestDto } from '@/modules/workspaces/dto/workspace.create.request.dto';
import { WorkspaceResponseDto } from '@/modules/workspaces/dto/workspace.response.dto';
import { WorkspaceUpdateRequestDto } from '@/modules/workspaces/dto/workspace.update.request.dto';
import { WorkspaceService } from '@/modules/workspaces/services/workspace.service';

@Controller('workspaces')
@ApiTags('workspaces')
export class WorkspaceController {
  public constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: WorkspaceResponseDto })
  @ApiForbiddenResponse({ description: 'Caller is not an org admin' })
  public createWorkspace(
    @User() user: UserEntity,
    @Body() body: WorkspaceCreateRequestDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.createWorkspace(user, body);
  }

  @Get()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WorkspaceResponseDto, isArray: true })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  public getMyWorkspaces(@User() user: UserEntity, @Query('orgId') orgId?: string): Promise<WorkspaceResponseDto[]> {
    return this.workspaceService.getMyWorkspaces(user, orgId);
  }

  @Get(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WorkspaceResponseDto })
  @ApiForbiddenResponse({ description: 'Not a workspace member' })
  @ApiNotFoundResponse()
  public getWorkspace(@Param('id', ParseUUIDPipe) id: string, @User() user: UserEntity): Promise<WorkspaceResponseDto> {
    return this.workspaceService.getWorkspace(id, user);
  }

  @Patch(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WorkspaceResponseDto })
  @ApiForbiddenResponse({ description: 'Caller is not an org admin' })
  @ApiNotFoundResponse()
  public updateWorkspace(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body() body: WorkspaceUpdateRequestDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.updateWorkspace(id, user, body);
  }

  @Delete(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Workspace deleted' })
  @ApiForbiddenResponse({ description: 'Caller is not an org admin' })
  @ApiNotFoundResponse()
  public deleteWorkspace(@Param('id', ParseUUIDPipe) id: string, @User() user: UserEntity): Promise<void> {
    return this.workspaceService.deleteWorkspace(id, user);
  }

  @Post(':id/members')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Member added' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiConflictResponse({ description: 'Already a member' })
  @ApiUnprocessableEntityResponse({ description: 'Target user is not an org member' })
  @ApiNotFoundResponse()
  public addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body() body: WorkspaceMemberAddRequestDto,
  ): Promise<void> {
    return this.workspaceService.addMember(id, user, body);
  }

  @Delete(':id/members/:userId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Member removed' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse()
  public removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.workspaceService.removeMember(id, user, userId);
  }
}
