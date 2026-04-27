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
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { SceneLightUpsertDto } from '../dto/scene-light.upsert.dto';
import { SceneObjectUpsertDto } from '../dto/scene-object.upsert.dto';
import { SceneCreateRequestDto } from '../dto/scene.create.request.dto';
import { SceneListItemResponseDto, SceneResponseDto } from '../dto/scene.response.dto';
import { SceneUpdateRequestDto } from '../dto/scene.update.request.dto';
import { ScenesService } from '../services/scenes.service';

const HDRI_MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

@Controller('scenes')
@ApiTags('scenes')
export class ScenesController {
  public constructor(private readonly scenesService: ScenesService) {}

  @Post()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: SceneResponseDto })
  public async createScene(@User() user: UserEntity, @Body() dto: SceneCreateRequestDto): Promise<SceneResponseDto> {
    return this.scenesService.createScene(user, dto);
  }

  @Get()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [SceneListItemResponseDto] })
  public async listScenes(
    @User() user: UserEntity,
    @Query('workspaceId', ParseUUIDPipe) workspaceId: string,
  ): Promise<SceneListItemResponseDto[]> {
    return this.scenesService.listScenes(workspaceId, user);
  }

  @Get(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SceneResponseDto })
  @ApiNotFoundResponse()
  public async getScene(@Param('id', ParseUUIDPipe) id: string, @User() user: UserEntity): Promise<SceneResponseDto> {
    return this.scenesService.getScene(id, user);
  }

  @Patch(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SceneResponseDto })
  public async updateScene(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body() dto: SceneUpdateRequestDto,
  ): Promise<SceneResponseDto> {
    return this.scenesService.updateScene(id, user, dto);
  }

  @Delete(':id')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  public async deleteScene(@Param('id', ParseUUIDPipe) id: string, @User() user: UserEntity): Promise<void> {
    return this.scenesService.deleteScene(id, user);
  }

  // ---- Objects ----------------------------------------------------------------

  @Post(':id/objects')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: SceneResponseDto })
  @ApiForbiddenResponse({ description: 'Object limit reached for your plan' })
  public async addObject(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body() dto: SceneObjectUpsertDto,
  ): Promise<SceneResponseDto> {
    return this.scenesService.addObject(id, user, dto);
  }

  @Patch(':id/objects/:objId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SceneResponseDto })
  public async updateObject(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('objId', ParseUUIDPipe) objId: string,
    @User() user: UserEntity,
    @Body() dto: SceneObjectUpsertDto,
  ): Promise<SceneResponseDto> {
    return this.scenesService.updateObject(id, objId, user, dto);
  }

  @Delete(':id/objects/:objId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  public async removeObject(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('objId', ParseUUIDPipe) objId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.scenesService.removeObject(id, objId, user);
  }

  // ---- Lights -----------------------------------------------------------------

  @Post(':id/lights')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: SceneResponseDto })
  @ApiForbiddenResponse({ description: 'Light limit reached for your plan' })
  public async addLight(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body() dto: SceneLightUpsertDto,
  ): Promise<SceneResponseDto> {
    return this.scenesService.addLight(id, user, dto);
  }

  @Patch(':id/lights/:lightId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SceneResponseDto })
  public async updateLight(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lightId', ParseUUIDPipe) lightId: string,
    @User() user: UserEntity,
    @Body() dto: SceneLightUpsertDto,
  ): Promise<SceneResponseDto> {
    return this.scenesService.updateLight(id, lightId, user, dto);
  }

  @Delete(':id/lights/:lightId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  public async removeLight(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lightId', ParseUUIDPipe) lightId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.scenesService.removeLight(id, lightId, user);
  }

  // ---- HDRI -------------------------------------------------------------------

  @Post(':id/hdri')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { dest: './files/models-3d/temp', limits: { fileSize: HDRI_MAX_SIZE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: SceneResponseDto })
  @ApiForbiddenResponse({ description: 'HDRI not available on your plan' })
  @ApiBadRequestResponse()
  public async uploadHdri(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SceneResponseDto> {
    return this.scenesService.uploadHdri(id, user, file);
  }

  @Get(':id/hdri')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'HDRI file (StreamableFile or redirect)' })
  @ApiNotFoundResponse()
  public async getHdri(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | void> {
    const result = await this.scenesService.getHdriFile(id);
    if ('redirect' in result) {
      res.redirect(HttpStatus.TEMPORARY_REDIRECT, result.redirect);
      return;
    }
    res.set({ 'Content-Type': 'application/octet-stream' });
    return result;
  }

  // ---- Thumbnail --------------------------------------------------------------

  @Post(':id/thumbnail')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SceneResponseDto })
  public async saveThumbnail(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
    @Body('thumbnail') thumbnail: string,
  ): Promise<SceneResponseDto> {
    return this.scenesService.saveThumbnail(id, user, thumbnail);
  }
}
