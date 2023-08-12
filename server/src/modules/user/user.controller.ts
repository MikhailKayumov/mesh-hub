import { JwtAuth } from '@decorators/auth/auth.decorator';
import { PaginatedRequest, PaginationDto } from '@decorators/pagination';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { UserCreateRequestDto } from './dto/user.create.request.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { UserUpdateRequestDto } from './dto/user.update.request.dto';
import { UserService } from './user.service';

@Controller('user')
@JwtAuth()
export class UserController {
  public constructor(private readonly userService: UserService) {}

  @Get('')
  public async getUsers(@PaginatedRequest() paginate: PaginationDto) {
    return await this.userService.getUsers(paginate);
  }

  @Get(':id')
  public getUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.userService.getUser(id);
  }

  @Post('')
  public createUser(@Body() body: UserCreateRequestDto) {
    return this.userService.createUser(body);
  }

  @Patch(':id')
  public updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() body: UserUpdateRequestDto) {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  public deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.deleteUser(id);
  }
}
