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
  Put,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { OptionalUser, User } from '@/decorators/user/user.decorator';
import { SceneAnnotationCreateRequestDto } from '@/modules/scenes/annotations/dto/scene-annotation.create.request.dto';
import { SceneAnnotationReorderRequestDto } from '@/modules/scenes/annotations/dto/scene-annotation.reorder.request.dto';
import { SceneAnnotationResponseDto } from '@/modules/scenes/annotations/dto/scene-annotation.response.dto';
import { SceneAnnotationUpdateRequestDto } from '@/modules/scenes/annotations/dto/scene-annotation.update.request.dto';
import { SceneAnnotationsService } from '@/modules/scenes/annotations/scene-annotations.service';

@Controller('scenes/:sceneId/annotations')
@ApiTags('scene-annotations')
export class SceneAnnotationsController {
  public constructor(private readonly sceneAnnotationsService: SceneAnnotationsService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [SceneAnnotationResponseDto] })
  public getAnnotations(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @OptionalUser() user?: UserEntity,
  ): Promise<SceneAnnotationResponseDto[]> {
    return this.sceneAnnotationsService.getAnnotations(sceneId, user);
  }

  @Post()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: SceneAnnotationResponseDto })
  public createAnnotation(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @User() user: UserEntity,
    @Body() dto: SceneAnnotationCreateRequestDto,
  ): Promise<SceneAnnotationResponseDto> {
    return this.sceneAnnotationsService.createAnnotation(sceneId, dto, user);
  }

  @Patch(':annotId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SceneAnnotationResponseDto })
  public updateAnnotation(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @Param('annotId', ParseUUIDPipe) annotId: string,
    @User() user: UserEntity,
    @Body() dto: SceneAnnotationUpdateRequestDto,
  ): Promise<SceneAnnotationResponseDto> {
    return this.sceneAnnotationsService.updateAnnotation(sceneId, annotId, dto, user);
  }

  @Delete(':annotId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  public async deleteAnnotation(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @Param('annotId', ParseUUIDPipe) annotId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.sceneAnnotationsService.deleteAnnotation(sceneId, annotId, user);
  }

  @Put('order')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  public async reorderAnnotations(
    @Param('sceneId', ParseUUIDPipe) sceneId: string,
    @User() user: UserEntity,
    @Body() dto: SceneAnnotationReorderRequestDto,
  ): Promise<void> {
    return this.sceneAnnotationsService.reorderAnnotations(sceneId, dto.items, user);
  }
}
