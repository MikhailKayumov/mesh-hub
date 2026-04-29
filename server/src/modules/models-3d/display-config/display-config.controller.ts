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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiConsumes, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { OptionalUser, User } from '@/decorators/user/user.decorator';
import { FileSizeValidator } from '@/pipes/file-size-validator.pipe';
import { DisplayConfigService } from './display-config.service';
import { DisplayConfigResponseDto } from './dto/display-config.response.dto';
import { DisplayConfigUpdateDto } from './dto/display-config.update.dto';
import { ModelLightUpsertDto, ModelLightUpdateDto } from './dto/model-light.upsert.dto';

const MAX_HDRI_SIZE = 20 * 1024 * 1024; // 20 MB

@Controller('models-3d/:modelId/display-config')
@ApiTags('display-config')
export class DisplayConfigController {
  public constructor(private readonly displayConfigService: DisplayConfigService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DisplayConfigResponseDto })
  @ApiNotFoundResponse()
  public async getConfig(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @OptionalUser() user: UserEntity | undefined,
  ): Promise<DisplayConfigResponseDto> {
    return this.displayConfigService.getOrCreate(modelId, user ?? null);
  }

  @Patch()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DisplayConfigResponseDto })
  @ApiBadRequestResponse()
  public async updateConfig(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
    @Body() dto: DisplayConfigUpdateDto,
  ): Promise<DisplayConfigResponseDto> {
    return this.displayConfigService.update(modelId, user, dto);
  }

  @Post('hdri')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { dest: './files/models-3d/temp' }))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: DisplayConfigResponseDto })
  @ApiBadRequestResponse()
  public async uploadHdri(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new FileSizeValidator(MAX_HDRI_SIZE)],
      }),
    )
    file: Express.Multer.File,
  ): Promise<DisplayConfigResponseDto> {
    return this.displayConfigService.uploadHdri(modelId, user, file);
  }

  @Delete('hdri')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DisplayConfigResponseDto })
  public async removeHdri(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
  ): Promise<DisplayConfigResponseDto> {
    return this.displayConfigService.removeHdri(modelId, user);
  }

  @Post('lights')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ type: DisplayConfigResponseDto })
  @ApiBadRequestResponse()
  public async addLight(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
    @Body() dto: ModelLightUpsertDto,
  ): Promise<DisplayConfigResponseDto> {
    return this.displayConfigService.addLight(modelId, user, dto);
  }

  @Patch('lights/:lightId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DisplayConfigResponseDto })
  @ApiNotFoundResponse()
  public async updateLight(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('lightId', ParseUUIDPipe) lightId: string,
    @User() user: UserEntity,
    @Body() dto: ModelLightUpdateDto,
  ): Promise<DisplayConfigResponseDto> {
    return this.displayConfigService.updateLight(modelId, lightId, user, dto);
  }

  @Delete('lights/:lightId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNotFoundResponse()
  public async removeLight(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('lightId', ParseUUIDPipe) lightId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.displayConfigService.removeLight(modelId, lightId, user);
  }
}
