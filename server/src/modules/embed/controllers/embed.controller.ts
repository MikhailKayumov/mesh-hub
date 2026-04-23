import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { ApiKeyGuard } from '@/modules/api-keys/guards/api-key.guard';
import { DomainAddRequestDto } from '@/modules/embed/dto/domain.add.request.dto';
import { EmbedProjectCreateRequestDto } from '@/modules/embed/dto/embed-project.create.request.dto';
import { EmbedProjectResponseDto } from '@/modules/embed/dto/embed-project.response.dto';
import { EmbedProjectUpdateRequestDto } from '@/modules/embed/dto/embed-project.update.request.dto';
import { EmbedViewerResponseDto } from '@/modules/embed/dto/embed-viewer.response.dto';
import { ViewAnalyticsResponseDto } from '@/modules/embed/dto/view-analytics.response.dto';
import { EmbedService } from '@/modules/embed/services/embed.service';

@Controller('embed')
@ApiTags('embed')
export class EmbedController {
  public constructor(private readonly embedService: EmbedService) {}

  // ---- Authenticated project management (must be declared before /:modelId) ----

  @Post('projects')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  public createProject(
    @User() user: UserEntity,
    @Body() dto: EmbedProjectCreateRequestDto,
  ): Promise<EmbedProjectResponseDto> {
    return this.embedService.createProject(user, dto);
  }

  @Get('projects')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  public listProjects(
    @User() user: UserEntity,
    @Query('orgId', ParseUUIDPipe) orgId: string,
  ): Promise<EmbedProjectResponseDto[]> {
    return this.embedService.listProjects(user, orgId);
  }

  @Patch('projects/:id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  public updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body() dto: EmbedProjectUpdateRequestDto,
  ): Promise<EmbedProjectResponseDto> {
    return this.embedService.updateProject(id, user, dto);
  }

  @Post('projects/:id/domains')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  public addDomain(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body() dto: DomainAddRequestDto,
  ): Promise<EmbedProjectResponseDto> {
    return this.embedService.addDomain(id, user, dto);
  }

  @Delete('projects/:id/domains/:domain')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  public removeDomain(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Param('domain') domain: string,
  ): Promise<void> {
    return this.embedService.removeDomain(id, user, domain);
  }

  @Get('projects/:id/analytics')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ViewAnalyticsResponseDto })
  public getAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
  ): Promise<ViewAnalyticsResponseDto> {
    return this.embedService.getAnalytics(id, user);
  }

  // ---- Public embed viewer endpoint (must be last to avoid routing collision) ----

  @Get(':modelId')
  @Public()
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EmbedViewerResponseDto })
  public getEmbedViewer(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Req() req: Request,
    @Headers('origin') origin: string | undefined,
  ): Promise<EmbedViewerResponseDto> {
    return this.embedService.getEmbedViewer(modelId, req.apiKey!, origin);
  }
}
