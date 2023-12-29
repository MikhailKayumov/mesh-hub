import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { UserRoles, ACCEPTED_3D_MODEL_FILE_TYPES, MAX_3D_MODEL_FILE_SIZE } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { PaginatedRequest, PaginatedResponse, PaginationDto, PaginationResponseDto } from '@/decorators/pagination';
import { User } from '@/decorators/user/user.decorator';
import { Model3dResponseDto } from '@/modules/models-3d/dto/model-3d.response.dto';
import { Model3dUpdateRequestDto } from '@/modules/models-3d/dto/model-3d.update.request.dto';
import { Models3dRequestDto } from '@/modules/models-3d/dto/models-3d.request.dto';
import { Model3dService } from '@/modules/models-3d/services/model-3d.service';
import { FileExtensionValidatorPipe } from '@/pipes/file-extension-validator.pipe';
import { FileSizeValidator } from '@/pipes/file-size-validator.pipe';

@Controller('models-3d')
@ApiTags('models-3d')
export class Model3dController {
  public constructor(private readonly model3dService: Model3dService) {}

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
    @User() user?: UserEntity,
  ) {
    return this.model3dService.get3DModels(pagination, filters, user);
  }

  @Get(':modelId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  public async get3DModel(@Param('modelId', ParseUUIDPipe) modelId: string, @User() user?: UserEntity) {
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
    schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  public upload3DModel(
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileSizeValidator(MAX_3D_MODEL_FILE_SIZE),
          new FileExtensionValidatorPipe(ACCEPTED_3D_MODEL_FILE_TYPES),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<{ modelId: string }> {
    return this.model3dService.upload3DModel(user, file);
  }
}
