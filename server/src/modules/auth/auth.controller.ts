import { JwtAuth, JwtRefreshAuth } from '@decorators/auth/auth.decorator';
import { SessionEntity } from '@entities/session/session.entity';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { Body, Controller, HttpCode, HttpStatus, Post, Session } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  public async login(@Body() dto: LoginRequestDto): Promise<SessionResponseDto> {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Logout was succeed' })
  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @JwtAuth()
  public async logout(@Session() session: SessionEntity): Promise<void> {
    return this.authService.logout(session);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: () => SessionResponseDto })
  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @JwtRefreshAuth()
  public async refresh(@Session() session: SessionEntity): Promise<SessionResponseDto> {
    return this.authService.refresh(session);
  }
}
