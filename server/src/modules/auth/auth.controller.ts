import { AuthService } from '@modules/auth/auth.service';
import { LoginRequestDto } from '@modules/auth/dto/login.request.dto';
import { RefreshRequestDto } from '@modules/auth/dto/refresh.request.dto';
import { SessionResponseDto } from '@modules/auth/dto/session.response.dto';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  public async signup(@Body() dto: UserCreateRequestDto): Promise<SessionResponseDto> {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() dto: LoginRequestDto): Promise<SessionResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  public async refresh(@Body() dto: RefreshRequestDto): Promise<SessionResponseDto> {
    return this.authService.refresh(dto);
  }
}
