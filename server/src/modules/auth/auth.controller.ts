import { JwtAuth } from '@decorators/auth/auth.decorator';
import { SessionEntity } from '@entities/session/session.entity';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Session } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login.request.dto';
import { SessionResponseDto } from './dto/session.response.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: () => SessionResponseDto })
  public async signup(@Body() dto: UserCreateRequestDto): Promise<SessionResponseDto> {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: () => SessionResponseDto })
  public async login(@Body() dto: LoginRequestDto, @Req() request: Request): Promise<SessionResponseDto> {
    return this.authService.login(dto, request);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Logout was succeed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @JwtAuth()
  public async logout(@Session() session: SessionEntity, @Req() request: Request): Promise<void> {
    return this.authService.logout(session, request);
  }
}
