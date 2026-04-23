import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { OptionalUser, User } from '@/decorators/user/user.decorator';
import { CommentCreateRequestDto } from '@/modules/reviews/dto/comment.create.request.dto';
import { CommentResponseDto } from '@/modules/reviews/dto/comment.response.dto';
import { CommentUpdateRequestDto } from '@/modules/reviews/dto/comment.update.request.dto';
import { ReviewsService } from '@/modules/reviews/services/reviews.service';

@Controller('models-3d/:modelId/comments')
@ApiTags('reviews')
export class ReviewsController {
  public constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  public getComments(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @OptionalUser() user?: UserEntity,
  ): Promise<CommentResponseDto[]> {
    return this.reviewsService.getComments(modelId, user);
  }

  @Post()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  public addComment(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
    @Body() dto: CommentCreateRequestDto,
  ): Promise<CommentResponseDto> {
    return this.reviewsService.addComment(modelId, user, dto);
  }

  @Patch(':commentId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  public updateComment(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @User() user: UserEntity,
    @Body() dto: CommentUpdateRequestDto,
  ): Promise<CommentResponseDto> {
    return this.reviewsService.updateComment(modelId, commentId, user, dto);
  }

  @Delete(':commentId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteComment(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.reviewsService.deleteComment(modelId, commentId, user);
  }
}
