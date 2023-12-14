import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Roles } from '@/decorators/auth/auth.decorator';
import { User } from '@/decorators/user/user.decorator';
import { UserChangePasswordRequestDto } from '@/modules/user/dto/user.change.password.request.dto';
import { UserCurrentResponseDto } from '@/modules/user/dto/user.current.response.dto';
import { UserCurrentUpdateRequestDto } from '@/modules/user/dto/user.current.update.request.dto';
import { UserNewPasswordRequestDto } from '@/modules/user/dto/user.new.password.request.dto';
import { UserResetPasswordRequestDto } from '@/modules/user/dto/user.reset.password.request.dto';
import { UserService } from '@/modules/user/services/user.service';

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
