import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Session,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Public, Refresh } from '@/decorators/auth/auth.decorator';
import { PaginatedRequest, PaginatedResponse, PaginationDto, PaginationResponseDto } from '@/decorators/pagination';
import { User } from '@/decorators/user/user.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginRequestDto } from '@/modules/auth/dto/login.request.dto';
import { SessionResponseDto } from '@/modules/auth/dto/session.response.dto';
import { SignupRequestDto } from '@/modules/auth/dto/signup.request.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: () => SessionResponseDto })
  public async signup(@Body() dto: SignupRequestDto, @Req() request: Request): Promise<SessionResponseDto> {
    return this.authService.signup(dto, request);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: () => SessionResponseDto })
  public async login(@Body() dto: LoginRequestDto, @Req() request: Request): Promise<SessionResponseDto> {
    return this.authService.login(dto, request);
  }

  @Post('refresh')
  @Refresh()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: () => SessionResponseDto })
  public async refresh(@Session() session: SessionEntity, @Req() request: Request): Promise<SessionResponseDto> {
    return this.authService.refresh(session, request);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Logout was succeed' })
  public async logout(@Session() session: SessionEntity, @Req() request: Request): Promise<void> {
    return this.authService.logout(session, request);
  }

  @Get('current-user-sessions')
  @PaginatedResponse(SessionResponseDto)
  public getCurrentUserSessions(
    @User() user: UserEntity,
    @PaginatedRequest() pagination: PaginationDto,
  ): Promise<PaginationResponseDto<SessionResponseDto>> {
    return this.authService.getCurrentUserSessions(user, pagination);
  }

  @Delete('current-user-sessions/:id')
  @ApiOkResponse()
  public closeCurrentUserSession(
    @User() user: UserEntity,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<void> {
    return this.authService.closeCurrentUserSession(user, sessionId);
  }

  @Delete('current-user-sessions')
  @ApiOkResponse()
  public closeCurrentUserSessions(@User() user: UserEntity): Promise<void> {
    return this.authService.closeCurrentUserSessions(user);
  }
}
