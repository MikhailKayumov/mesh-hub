import { createReadStream } from 'fs';
import { resolve, sep } from 'path';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
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
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  UserRoles,
  ACCEPTED_3D_MODEL_FILE_TYPES,
  DEFAULT_MAX_3D_MODEL_FILE_SIZE,
  MODEL_MAX_SIZE_BYTES,
} from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { PaginatedRequest, PaginatedResponse, PaginationDto, PaginationResponseDto } from '@/decorators/pagination';
import { OptionalUser, User } from '@/decorators/user/user.decorator';
import { FilesService } from '@/modules/files/files.service';
import { Model3dResponseDto } from '@/modules/models-3d/dto/model-3d.response.dto';
import { Model3dUpdateRequestDto } from '@/modules/models-3d/dto/model-3d.update.request.dto';
import { Models3dRequestDto, UploadModel3dRequestDto } from '@/modules/models-3d/dto/models-3d.request.dto';
import { Model3dService } from '@/modules/models-3d/services/model-3d.service';
import { FileExtensionValidatorPipe } from '@/pipes/file-extension-validator.pipe';
import { FileSizeValidator } from '@/pipes/file-size-validator.pipe';

@Controller('models-3d')
@ApiTags('models-3d')
export class Model3dController {
  public constructor(
    private readonly model3dService: Model3dService,
    private readonly filesService: FilesService,
  ) {}

  @Get('current-user')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ type: () => Models3dRequestDto })
  @PaginatedResponse(Model3dResponseDto)
  public async getCurrentUser3DModels(
    @User() user: UserEntity,
    @PaginatedRequest() pagination: PaginationDto,
    @Query() filters: Models3dRequestDto,
  ): Promise<PaginationResponseDto<Model3dResponseDto>> {
    return this.model3dService.getCurrentUser3DModels(pagination, filters, user);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ type: () => Models3dRequestDto })
  @PaginatedResponse(Model3dResponseDto)
  public async get3DModels(
    @PaginatedRequest() pagination: PaginationDto,
    @Query() filters: Models3dRequestDto,
    @OptionalUser() user?: UserEntity,
  ) {
    return this.model3dService.get3DModels(pagination, filters, user);
  }

  @Get('stats')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Public model statistics' })
  public async getStats(): Promise<{ totalModels: number }> {
    return this.model3dService.getStats();
  }

  @Get(':modelId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  public async get3DModel(@Param('modelId', ParseUUIDPipe) modelId: string, @OptionalUser() user?: UserEntity) {
    return this.model3dService.get3DModel(modelId, user);
  }

  @Patch(':modelId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  public async update3DModel(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
    @Body() body: Model3dUpdateRequestDto,
  ) {
    return this.model3dService.update3DModel(modelId, user, body);
  }

  @Delete(':modelId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  public async delete3DModel(@Param('modelId', ParseUUIDPipe) modelId: string, @User() user: UserEntity) {
    return this.model3dService.delete3DModel(modelId, user);
  }

  @Post(':modelId/save-thumbnail-base64')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse()
  @ApiBadRequestResponse()
  public async save3DModelThumbnailFromBase64(
    @User() user: UserEntity,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Body('thumbnail') thumbnail: string,
  ): Promise<void> {
    return this.model3dService.save3DModelThumbnailFromBase64(user, modelId, thumbnail);
  }

  @Post('upload')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { dest: './files/models-3d/temp' }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        workspaceId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  public upload3DModel(
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileSizeValidator(MODEL_MAX_SIZE_BYTES, DEFAULT_MAX_3D_MODEL_FILE_SIZE),
          new FileExtensionValidatorPipe(ACCEPTED_3D_MODEL_FILE_TYPES),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadModel3dRequestDto,
  ): Promise<{ modelId: string }> {
    return this.model3dService.upload3DModel(user, file, body.workspaceId);
  }

  @Get('files/:modelId/thumbnail')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  public getModels3DThumbnailFile(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const base = resolve(process.cwd(), 'files', 'models-3d', modelId);
    const target = this.safeResolvePath(base, 'thumbnail.png');
    res.setHeader('Cache-Control', 'max-age=31536000'); // 1 year — only on success
    return new StreamableFile(createReadStream(target));
  }

  @Get('files/:modelId/versions/:versionId/*splat')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  public async getModelVersionFile(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('splat') fileName: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | void> {
    const model = await this.model3dService.getModel(modelId);

    if (model.workspaceId) {
      const workspace = await this.model3dService.getWorkspace(model.workspaceId);
      const strategy = await this.filesService.getStrategyForOrg(workspace.orgId);
      const url = await strategy.getFileUrl(`models-3d/${modelId}/versions/${versionId}/${fileName}`);
      if (url) {
        res.redirect(307, url);
        return;
      }
    }

    const base = resolve(process.cwd(), 'files', 'models-3d', modelId, 'versions', versionId);
    const target = this.safeResolvePath(base, fileName);
    res.setHeader('Cache-Control', 'max-age=2592000'); // 30 days — only on success
    return new StreamableFile(createReadStream(target));
  }

  @Get('files/:modelId/*splat')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  public async getModels3DFile(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('splat') fileName: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | void> {
    const model = await this.model3dService.getModel(modelId);

    if (model.workspaceId) {
      const workspace = await this.model3dService.getWorkspace(model.workspaceId);
      const strategy = await this.filesService.getStrategyForOrg(workspace.orgId);
      const url = await strategy.getFileUrl(`models-3d/${modelId}/${fileName}`);
      if (url) {
        res.redirect(307, url);
        return;
      }
    }

    const base = resolve(process.cwd(), 'files', 'models-3d', modelId);
    const target = this.safeResolvePath(base, fileName);
    res.setHeader('Cache-Control', 'max-age=2592000'); // 30 days — only on success
    return new StreamableFile(createReadStream(target));
  }

  private safeResolvePath(base: string, ...segments: string[]): string {
    const resolved = resolve(base, ...segments);
    if (!resolved.startsWith(base + sep) && resolved !== base) {
      throw new ForbiddenException();
    }
    return resolved;
  }
}
