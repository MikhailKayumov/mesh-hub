import { createReadStream, existsSync } from 'fs';
import { resolve } from 'path';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Put,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { FileSizeValidator } from '@/pipes/file-size-validator.pipe';
import { FileTypeValidator } from '@/pipes/file-type-validator.pipe';
import { MaterialOverrideResponseDto } from './dto/material-override.response.dto';
import { MaterialOverrideUpsertDto } from './dto/material-override.upsert.dto';
import { MaterialsService } from './materials.service';

const MAX_TEXTURE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TEXTURE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

@Controller('models-3d/:modelId/materials')
@ApiTags('materials')
export class MaterialsController {
  public constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MaterialOverrideResponseDto, isArray: true })
  public async listMaterials(@Param('modelId', ParseUUIDPipe) modelId: string): Promise<MaterialOverrideResponseDto[]> {
    return this.materialsService.listMaterials(modelId);
  }

  @Put(':meshName')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MaterialOverrideResponseDto })
  @ApiBadRequestResponse()
  public async upsertMaterial(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('meshName') meshName: string,
    @User() user: UserEntity,
    @Body() dto: MaterialOverrideUpsertDto,
  ): Promise<MaterialOverrideResponseDto> {
    return this.materialsService.upsertMaterial(modelId, decodeURIComponent(meshName), user, dto);
  }

  @Delete(':meshName')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  public async deleteMaterial(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('meshName') meshName: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.materialsService.deleteMaterial(modelId, decodeURIComponent(meshName), user);
  }

  @Post(':meshName/texture/:type')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { dest: './files/models-3d/temp' }))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: MaterialOverrideResponseDto })
  @ApiBadRequestResponse()
  public async uploadTexture(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('meshName') meshName: string,
    @Param('type') type: string,
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new FileSizeValidator(MAX_TEXTURE_SIZE), new FileTypeValidator(ALLOWED_TEXTURE_TYPES)],
      }),
    )
    file: Express.Multer.File,
  ): Promise<MaterialOverrideResponseDto> {
    return this.materialsService.uploadTexture(modelId, decodeURIComponent(meshName), user, type, file);
  }

  @Delete(':meshName/texture/:type')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MaterialOverrideResponseDto })
  @ApiNotFoundResponse()
  public async clearTexture(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('meshName') meshName: string,
    @Param('type') type: string,
    @User() user: UserEntity,
  ): Promise<MaterialOverrideResponseDto> {
    return this.materialsService.clearTexture(modelId, decodeURIComponent(meshName), user, type);
  }

  @Get(':meshName/texture/:type')
  @Public()
  @ApiOkResponse({ description: 'Texture image binary' })
  @ApiNotFoundResponse()
  public async serveTexture(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('meshName') meshName: string,
    @Param('type') type: string,
  ): Promise<StreamableFile> {
    const decodedMeshName = decodeURIComponent(meshName);
    const result = await this.materialsService.getOverrideForTexture(modelId, decodedMeshName, type);
    if (!result) throw new NotFoundException('Texture not found');

    const absPath = resolve(process.cwd(), 'files', result.path);
    if (!existsSync(absPath)) throw new NotFoundException('Texture file not found');

    const stream = createReadStream(absPath);
    return new StreamableFile(stream, { type: result.mimeType });
  }
}
