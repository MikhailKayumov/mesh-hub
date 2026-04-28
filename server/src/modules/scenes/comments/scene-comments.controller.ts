import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { OptionalUser, User } from '@/decorators/user/user.decorator';
import { SceneCommentCreateRequestDto } from '@/modules/scenes/comments/dto/scene-comment.create.request.dto';
import { SceneCommentResponseDto } from '@/modules/scenes/comments/dto/scene-comment.response.dto';
import { SceneCommentUpdateRequestDto } from '@/modules/scenes/comments/dto/scene-comment.update.request.dto';
import { SceneCommentsService } from '@/modules/scenes/comments/scene-comments.service';

@Controller('scenes/:sceneId/comments')
@ApiTags('scene-comments')
export class SceneCommentsController {
  public constructor(private readonly sceneCommentsService: SceneCommentsService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [SceneCommentResponseDto] })
  public getComments(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @OptionalUser() user?: UserEntity,
  ): Promise<SceneCommentResponseDto[]> {
    return this.sceneCommentsService.getComments(sceneId, user);
  }

  @Post()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: SceneCommentResponseDto })
  public addComment(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @User() user: UserEntity,
    @Body() dto: SceneCommentCreateRequestDto,
  ): Promise<SceneCommentResponseDto> {
    return this.sceneCommentsService.addComment(sceneId, dto, user);
  }

  @Patch(':commentId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SceneCommentResponseDto })
  public updateComment(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @User() user: UserEntity,
    @Body() dto: SceneCommentUpdateRequestDto,
  ): Promise<SceneCommentResponseDto> {
    return this.sceneCommentsService.updateComment(sceneId, commentId, dto, user);
  }

  @Delete(':commentId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  public async deleteComment(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.sceneCommentsService.deleteComment(sceneId, commentId, user);
  }
}
