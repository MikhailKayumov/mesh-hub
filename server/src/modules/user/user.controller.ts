import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from '@/database/entities/user/user.entity';
import { JwtAuth, Public } from '@/decorators/auth/auth.decorator';
import { PaginatedRequest, PaginatedResponse, PaginationDto, PaginationResponseDto } from '@/decorators/pagination';
import { User } from '@/decorators/user/user.decorator';
import { UserChangePasswordRequestDto } from '@/modules/user/dto/user.change.password.request.dto';
import { UserCurrentUpdateRequestDto } from '@/modules/user/dto/user.current.update.request.dto';
import { UserNewPasswordRequestDto } from '@/modules/user/dto/user.new.password.request.dto';
import { UserResetPasswordRequestDto } from '@/modules/user/dto/user.reset.password.request.dto';
import { UserCreateRequestDto } from './dto/user.create.request.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { UserUpdateRequestDto } from './dto/user.update.request.dto';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('user')
@ApiForbiddenResponse({ description: 'Unauthorized' })
@JwtAuth()
export class UserController {
  public constructor(private readonly userService: UserService) {}

  @Get('')
  @PaginatedResponse(UserResponseDto)
  public async getUsers(
    @PaginatedRequest(UserEntity) paginate: PaginationDto,
  ): Promise<PaginationResponseDto<UserResponseDto>> {
    return await this.userService.getUsers(paginate);
  }

  @Post('')
  @ApiCreatedResponse({ type: () => UserResponseDto })
  public createUser(@Body() body: UserCreateRequestDto): Promise<UserResponseDto> {
    return this.userService.createUser(body);
  }

  @Get('current')
  @ApiOkResponse({ type: () => UserResponseDto })
  @ApiNotFoundResponse()
  public getCurrentUser(@User() user: UserEntity): Promise<UserResponseDto> {
    return this.userService.getUser(user.id);
  }

  @Patch('current')
  @ApiOkResponse({ type: () => UserResponseDto })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  public updateCurrentUser(
    @User() user: UserEntity,
    @Body() body: UserCurrentUpdateRequestDto,
  ): Promise<UserResponseDto> {
    console.log(body);
    return this.userService.getUser(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ type: () => UserResponseDto })
  @ApiNotFoundResponse()
  public getUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.userService.getUser(id);
  }

  @Patch('reset-password')
  @Public()
  @ApiBody({ type: UserResetPasswordRequestDto })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @ApiInternalServerErrorResponse()
  public resetPassword(@Body('email') email: string): Promise<void> {
    return this.userService.resetPassword(email);
  }

  @Patch('new-password')
  @Public()
  @ApiBody({ type: UserNewPasswordRequestDto })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  public newPassword(@Body() { requestId, password, confirmPassword }: UserNewPasswordRequestDto): Promise<void> {
    return this.userService.newPassword(requestId, password, confirmPassword);
  }

  @Patch('change-password')
  @ApiBody({ type: UserChangePasswordRequestDto })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  public changePassword(
    @User() user: UserEntity,
    @Body() { oldPassword, password, confirmPassword }: UserChangePasswordRequestDto,
  ): Promise<void> {
    return this.userService.changePassword(user, oldPassword, password, confirmPassword);
  }

  @Patch(':id')
  @ApiOkResponse({ type: () => UserResponseDto })
  public updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UserUpdateRequestDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  public deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
