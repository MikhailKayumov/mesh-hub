import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  UserRoles,
  ACCEPTED_3D_MODEL_FILE_TYPES,
  DEFAULT_MAX_3D_MODEL_FILE_SIZE,
  MODEL_MAX_SIZE_BYTES,
} from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { FileExtensionValidatorPipe } from '@/pipes/file-extension-validator.pipe';
import { FileSizeValidator } from '@/pipes/file-size-validator.pipe';
import { VersionResponseDto } from './dto/version.response.dto';
import { VersionUploadRequestDto } from './dto/version.upload.request.dto';
import { VersionsService } from './versions.service';

@Controller('models-3d/:modelId/versions')
@ApiTags('versions')
export class VersionsController {
  public constructor(private readonly versionsService: VersionsService) {}

  @Get()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [VersionResponseDto] })
  @ApiNotFoundResponse()
  public async getVersions(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
  ): Promise<VersionResponseDto[]> {
    return this.versionsService.getVersions(modelId, user);
  }

  @Post()
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
        changeNotes: { type: 'string', maxLength: 500 },
      },
    },
  })
  @ApiOkResponse({ type: VersionResponseDto })
  @ApiBadRequestResponse()
  public async uploadVersion(
    @Param('modelId', ParseUUIDPipe) modelId: string,
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
    @Body() body: VersionUploadRequestDto,
  ): Promise<VersionResponseDto> {
    return this.versionsService.uploadVersion(modelId, user, file, body);
  }

  @Post(':versionId/activate')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: VersionResponseDto })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  public async activateVersion(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @User() user: UserEntity,
  ): Promise<VersionResponseDto> {
    return this.versionsService.activateVersion(modelId, versionId, user);
  }

  @Delete(':versionId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  public async deleteVersion(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.versionsService.deleteVersion(modelId, versionId, user);
  }
}
