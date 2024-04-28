import { createReadStream } from 'fs';
import { join } from 'path';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Patch,
  Post,
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
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UserRoles, ALLOWED_AVATAR_FILE_TYPES, MAX_AVATAR_FILE_SIZE } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { UserChangePasswordRequestDto } from '@/modules/user/dto/user.change.password.request.dto';
import { UserCurrentResponseDto } from '@/modules/user/dto/user.current.response.dto';
import { UserCurrentUpdateRequestDto } from '@/modules/user/dto/user.current.update.request.dto';
import { UserNewPasswordRequestDto } from '@/modules/user/dto/user.new.password.request.dto';
import { UserResetPasswordRequestDto } from '@/modules/user/dto/user.reset.password.request.dto';
import { UserService } from '@/modules/user/services/user.service';
import { FileSizeValidator } from '@/pipes/file-size-validator.pipe';
import { FileTypeValidator } from '@/pipes/file-type-validator.pipe';

@Controller('user')
@ApiTags('user')
@Roles([UserRoles.User])
export class UserController {
  public constructor(private readonly userService: UserService) {}

  @Get('current')
  @ApiOkResponse({ type: () => UserCurrentResponseDto })
  @ApiNotFoundResponse()
  public getCurrentUser(@User() user: UserEntity): Promise<UserCurrentResponseDto> {
    return this.userService.getCurrentUser(user.id);
  }

  @Patch('current')
  @ApiOkResponse({ type: () => UserCurrentResponseDto })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  public updateCurrentUser(
    @User() user: UserEntity,
    @Body() body: UserCurrentUpdateRequestDto,
  ): Promise<UserCurrentResponseDto> {
    return this.userService.updateCurrentUser(user, body);
  }

  @Post('current/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiUnprocessableEntityResponse()
  @ApiInternalServerErrorResponse()
  public updateCurrentUserAvatar(
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new FileSizeValidator(MAX_AVATAR_FILE_SIZE), new FileTypeValidator(ALLOWED_AVATAR_FILE_TYPES)],
      }),
    )
    file?: Express.Multer.File,
  ): Promise<void> {
    return this.userService.updateCurrentUserAvatar(user, file);
  }

  @Get('current/avatar/:fileName')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  public async getUserAvatar(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = createReadStream(join(process.cwd(), 'files', 'avatars', fileName));
    response.set({ 'Content-Disposition': `attachment; filename="${fileName}"` });
    return new StreamableFile(file);
  }

  @Patch('reset-password')
  @Public()
  @ApiBody({ type: () => UserResetPasswordRequestDto })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  public resetPassword(@Body('email') email: string): Promise<void> {
    return this.userService.resetPassword(email);
  }

  @Patch('new-password')
  @Public()
  @ApiBody({ type: () => UserNewPasswordRequestDto })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  public newPassword(@Body() dto: UserNewPasswordRequestDto): Promise<void> {
    return this.userService.newPassword(dto);
  }

  @Patch('change-password')
  @ApiBody({ type: () => UserChangePasswordRequestDto })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  public changePassword(@User() user: UserEntity, @Body() dto: UserChangePasswordRequestDto): Promise<void> {
    return this.userService.changePassword(user, dto);
  }
}
