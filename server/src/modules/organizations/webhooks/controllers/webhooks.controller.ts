import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrgMemberRole as OrgMemberRoleEnum } from '@/database/entities/organizations/org-member.entity';
import { OrgMemberRole } from '@/modules/organizations/guards/org-member-role.decorator';
import { WebhookDeliveryLogResponseDto } from '../dto/webhook-delivery-log.response.dto';
import { WebhookCreateRequestDto } from '../dto/webhook.create.request.dto';
import { WebhookCreateResponseDto } from '../dto/webhook.create.response.dto';
import { WebhookResponseDto } from '../dto/webhook.response.dto';
import { WebhooksService } from '../services/webhooks.service';

@Controller('organizations/:id/webhooks')
@ApiTags('webhooks')
export class WebhooksController {
  public constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @OrgMemberRole(OrgMemberRoleEnum.Admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: WebhookCreateResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient org role' })
  public create(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Body() body: WebhookCreateRequestDto,
  ): Promise<WebhookCreateResponseDto> {
    return this.webhooksService.create(orgId, body);
  }

  @Get()
  @OrgMemberRole(OrgMemberRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [WebhookResponseDto] })
  @ApiForbiddenResponse({ description: 'Insufficient org role' })
  public list(@Param('id', ParseUUIDPipe) orgId: string): Promise<WebhookResponseDto[]> {
    return this.webhooksService.list(orgId);
  }

  @Delete(':webhookId')
  @OrgMemberRole(OrgMemberRoleEnum.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Insufficient org role' })
  @ApiNotFoundResponse({ description: 'Webhook not found' })
  public revoke(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
  ): Promise<void> {
    return this.webhooksService.revoke(orgId, webhookId);
  }

  @Get(':webhookId/deliveries')
  @OrgMemberRole(OrgMemberRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [WebhookDeliveryLogResponseDto] })
  @ApiForbiddenResponse({ description: 'Insufficient org role' })
  @ApiNotFoundResponse({ description: 'Webhook not found' })
  public deliveries(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
  ): Promise<WebhookDeliveryLogResponseDto[]> {
    return this.webhooksService.getDeliveryLog(orgId, webhookId, 20);
  }
}
