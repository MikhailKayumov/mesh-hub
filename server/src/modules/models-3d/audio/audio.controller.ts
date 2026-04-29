import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Redirect,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiConsumes, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { OptionalUser, User } from '@/decorators/user/user.decorator';
import { FileSizeValidator } from '@/pipes/file-size-validator.pipe';
import { AudioService } from './audio.service';
import { ModelAudioResponseDto } from './dto/model-audio.response.dto';

const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MB
const AUDIO_MIME_PATTERN = /^audio\/(mpeg|mp3|ogg|wav|x-wav|wave)$/;

@Controller('models-3d/:modelId/audio')
@ApiTags('models-3d-audio')
export class AudioController {
  public constructor(private readonly audioService: AudioService) {}

  @Get()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ModelAudioResponseDto, isArray: true })
  public async list(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
  ): Promise<ModelAudioResponseDto[]> {
    return this.audioService.list(modelId, user);
  }

  @Post()
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ModelAudioResponseDto })
  @ApiBadRequestResponse()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  public async upload(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileSizeValidator(MAX_AUDIO_SIZE), new FileTypeValidator({ fileType: AUDIO_MIME_PATTERN })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ModelAudioResponseDto> {
    return this.audioService.upload(modelId, user, file);
  }

  @Delete(':audioId')
  @Roles([UserRoles.User])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNotFoundResponse()
  public async remove(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('audioId', ParseUUIDPipe) audioId: string,
    @User() user: UserEntity,
  ): Promise<void> {
    return this.audioService.remove(modelId, audioId, user);
  }

  @Get(':audioId/stream')
  @Public()
  @Redirect()
  public async stream(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('audioId', ParseUUIDPipe) audioId: string,
    @OptionalUser() user: UserEntity | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | { url: string; statusCode: number }> {
    const result = await this.audioService.streamAudio(modelId, audioId, user ?? null);
    if ('redirect' in result) {
      return { url: result.redirect, statusCode: HttpStatus.FOUND };
    }
    res.set('Content-Type', 'audio/mpeg');
    return result;
  }
}
