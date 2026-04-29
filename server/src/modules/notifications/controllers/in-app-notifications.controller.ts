import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { NotificationResponseDto, UnreadCountResponseDto } from '../dto/notification.response.dto';
import { InAppNotificationsService } from '../services/in-app-notifications.service';

@Controller('notifications')
@ApiTags('notifications')
export class InAppNotificationsController {
  public constructor(private readonly service: InAppNotificationsService) {}

  @Get()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [NotificationResponseDto] })
  public async list(@User() user: UserEntity): Promise<NotificationResponseDto[]> {
    return this.service.listForUser(user.id);
  }

  @Get('unread-count')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UnreadCountResponseDto })
  public async unreadCount(@User() user: UserEntity): Promise<UnreadCountResponseDto> {
    return this.service.unreadCount(user.id);
  }

  @Patch('read-all')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  public async markAllRead(@User() user: UserEntity): Promise<void> {
    await this.service.markAllRead(user.id);
  }

  @Patch(':id/read')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  public async markRead(@Param('id', ParseUUIDPipe) id: string, @User() user: UserEntity): Promise<void> {
    await this.service.markRead(id, user.id);
  }
}
