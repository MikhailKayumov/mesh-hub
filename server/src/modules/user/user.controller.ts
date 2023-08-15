import { JwtAuth } from '@decorators/auth/auth.decorator';
import { PaginatedRequest, PaginatedResponse, PaginationDto, PaginationResponseDto } from '@decorators/pagination';
import { UserEntity } from '@entities/user/user.entity';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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

  @Get(':id')
  @ApiOkResponse({ type: () => UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  public getUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.userService.getUser(id);
  }

  @Post('')
  @ApiCreatedResponse({ type: () => UserResponseDto })
  public createUser(@Body() body: UserCreateRequestDto): Promise<UserResponseDto> {
    return this.userService.createUser(body);
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
  @ApiOkResponse({ description: 'Logout was succeed' })
  public deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.deleteUser(id);
  }
}
