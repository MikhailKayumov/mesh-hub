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
import { ApiTags } from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { AnnotationCreateRequestDto } from '@/modules/annotations/dto/annotation.create.request.dto';
import { AnnotationReorderRequestDto } from '@/modules/annotations/dto/annotation.reorder.request.dto';
import { AnnotationResponseDto } from '@/modules/annotations/dto/annotation.response.dto';
import { AnnotationUpdateRequestDto } from '@/modules/annotations/dto/annotation.update.request.dto';
import { AnnotationsService } from '@/modules/annotations/services/annotations.service';

@Controller('models-3d/:modelId/annotations')
@ApiTags('annotations')
export class AnnotationsController {
  public constructor(private readonly annotationsService: AnnotationsService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  public getAnnotations(@Param('modelId', ParseUUIDPipe) modelId: string): Promise<AnnotationResponseDto[]> {
    return this.annotationsService.getAnnotations(modelId);
  }

  @Post()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  public createAnnotation(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
    @Body() dto: AnnotationCreateRequestDto,
  ): Promise<AnnotationResponseDto> {
    return this.annotationsService.createAnnotation(modelId, user, dto);
  }

  @Patch(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  public updateAnnotation(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body() dto: AnnotationUpdateRequestDto,
  ): Promise<AnnotationResponseDto> {
    return this.annotationsService.updateAnnotation(modelId, id, user, dto);
  }

  @Delete(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteAnnotation(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.annotationsService.deleteAnnotation(modelId, id, user);
  }

  @Put('reorder')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  public async reorderAnnotations(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
    @Body() dto: AnnotationReorderRequestDto,
  ): Promise<void> {
    return this.annotationsService.reorderAnnotations(modelId, user, dto.ids);
  }
}
