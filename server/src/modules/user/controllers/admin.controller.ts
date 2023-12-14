import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRoles } from '@/constants';
import { Roles } from '@/decorators/auth/auth.decorator';
import { UserService } from '@/modules/user/services/user.service';

@Controller('admin/users')
@ApiTags('admin/users')
@Roles([UserRoles.Admin, UserRoles.SuperUser])
export class AdminController {
  public constructor(private readonly userService: UserService) {}

  // @Get('')
  // @PaginatedResponse(UserResponseDto)
  // public async getUsers(
  //   @PaginatedRequest(UserEntity) paginate: PaginationDto,
  // ): Promise<PaginationResponseDto<UserResponseDto>> {
  //   return await this.userService.getUsers(paginate);
  // }
  //
  // @Post('')
  // @ApiCreatedResponse({ type: () => UserResponseDto })
  // public createUser(@Body() body: UserCreateRequestDto): Promise<UserResponseDto> {
  //   return this.userService.createUser(body);
  // }
  //
  // @Get(':id')
  // @ApiOkResponse({ type: () => UserResponseDto })
  // @ApiNotFoundResponse()
  // public getUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
  //   return this.userService.getUser(id);
  // }
  //
  // @Patch(':id')
  // @ApiOkResponse({ type: () => UserResponseDto })
  // public updateUser(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() body: UserUpdateRequestDto,
  // ): Promise<UserResponseDto> {
  //   return this.userService.updateUser(id, body);
  // }
  //
  // @Delete(':id')
  // @ApiOkResponse()
  // @ApiNotFoundResponse()
  // public deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
  //   return this.userService.deleteUser(id);
  // }
}
