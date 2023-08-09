import { Auth } from '@decorators/auth/auth.decorator';
import { PaginatedRequest, PaginationDto } from '@decorators/pagination';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { UserResponseDto } from '@modules/user/dto/user.response.dto';
import { UserUpdateRequestDto } from '@modules/user/dto/user.update.request.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  public constructor(private readonly userService: UserService) {}

  @Get('')
  // @Auth()
  public async getUsers(@PaginatedRequest() paginate: PaginationDto) {
    // throw new HttpException('Test error', HttpStatus.MOVED_PERMANENTLY);
    return await this.userService.getUsers(paginate);
  }

  @Get(':id')
  @Auth()
  public getUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.userService.getUser(id);
  }

  @Post('')
  @Auth()
  public createUser(@Body() body: UserCreateRequestDto) {
    return this.userService.createUser(body);
  }

  @Patch(':id')
  @Auth()
  public updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() body: UserUpdateRequestDto) {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  @Auth()
  public deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.deleteUser(id);
  }
}
