import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Request } from 'express';
import { LessThan, MoreThanOrEqual } from 'typeorm';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { PaginationDto, PaginationResponseDto, PaginationSortOrder } from '@/decorators/pagination';
import { SignupRequestDto } from '@/modules/auth/dto/signup.request.dto';
import { JwtPayload } from '@/modules/auth/types';
import { ConfigService } from '@/modules/config/config.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { UserService } from '@/modules/user/services/user.service';
import { AuthMapper } from './auth.mapper';
import { AuthRepository } from './auth.repository';
import { LoginRequestDto } from './dto/login.request.dto';
import { SessionResponseDto } from './dto/session.response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  public constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  public async getCurrentUserSessions(
    user: UserEntity,
    { size = 10, skip = 0, sort }: PaginationDto,
  ): Promise<PaginationResponseDto<SessionResponseDto>> {
    const order: Record<string, PaginationSortOrder> = {};
    if (sort?.[0]) {
      order[sort[0].field] = sort[0].by;
    }

    const [sessions, count] = await this.authRepository.findAndCount({
      where: { user: { id: user.id } },
      skip,
      take: size,
      order,
    });

    return PaginationResponseDto.build(sessions.map(AuthMapper.toSessionResponse), count, size, skip, sort);
  }

  public async closeCurrentUserSession(user: UserEntity, sessionId: string): Promise<void> {
    await this.authRepository.delete({ id: sessionId, user: { id: user.id } });
  }

  public async closeCurrentUserSessions(user: UserEntity): Promise<void> {
    await this.authRepository.delete({ user: { id: user.id } });
  }

  public async signup({ confirmPassword, ...dto }: SignupRequestDto, request: Request): Promise<SessionResponseDto> {
    if (dto.password !== confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    request.session = await this.createSession(request, await this.userService.createUserEntity(dto));

    return AuthMapper.toSessionResponse(request.session);
  }

  public async login({ email, password }: LoginRequestDto, request: Request): Promise<SessionResponseDto> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await this.userService.comparePassword(password, user.salt, user.password))) {
      throw new BadRequestException('Неверные email или пароль');
    }

    request.session = await this.createSession(request, user);

    // this.notificationsService.sendEmail(email, 'Авторизация', 'Пользователь успешно авторизирован');

    return AuthMapper.toSessionResponse(request.session);
  }

  public async logout(session: SessionEntity, request: Request): Promise<void> {
    request.session = null;
    this.authRepository.delete(session.id);
  }

  public async refresh(session: SessionEntity, request: Request): Promise<SessionResponseDto> {
    try {
      await this.jwtService.verifyAsync(session.refreshToken, {
        secret: this.configService.jwt.refreshSecret,
        algorithms: [this.configService.jwt.algorithm],
      });

      const [accessToken, refreshToken] = await this.createTokens(session.user);

      session.accessToken = accessToken;
      session.refreshToken = refreshToken;

      request.session = await this.authRepository.save(session);

      return AuthMapper.toSessionResponse(request.session);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  public async validateSession(
    token: string | null,
    ip: string,
    userAgent: string | undefined,
  ): Promise<[SessionEntity | null, boolean]> {
    const verifiedToken = await this.verifyAccessToken(token ?? '');
    if (!verifiedToken) return [null, false];

    return [
      await this.authRepository.getSession(verifiedToken.userId, token!, ip, userAgent),
      Math.floor(Date.now() * 0.001) < (verifiedToken?.exp ?? 0),
    ];
  }

  private async createSession(request: Request, user: UserEntity): Promise<SessionEntity> {
    const exitingSession = await this.authRepository.findOne({
      relations: {
        user: true,
      },
      where: {
        user: {
          id: user.id,
        },
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        expiredAt: MoreThanOrEqual(new Date()),
      },
    });

    if (exitingSession) return exitingSession;

    const [accessToken, refreshToken] = await this.createTokens(user);

    return this.authRepository.createSession(
      accessToken,
      refreshToken,
      user,
      request.ip,
      request.headers['user-agent'],
    );
  }

  private async createTokens(user: UserEntity) {
    const payload = { userId: user.id, userEmail: user.email, createAt: Date.now() };

    return await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.jwt.refreshSecret,
        algorithm: this.configService.jwt.algorithm,
        expiresIn: this.configService.jwt.refreshExpiresIn,
      }),
    ]);
  }

  private async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      return <JwtPayload>await this.jwtService.verifyAsync(token, { ignoreExpiration: true });
    } catch (e: unknown) {
      this.logger.warn('Access token has been expire');
      return null;
    }
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  private async clearSessions(): Promise<void> {
    const { affected } = await this.authRepository.delete({
      expiredAt: LessThan(new Date()),
    });
    this.logger.log(`${affected ?? 0} expired session${(affected ?? 0) > 2 ? 's' : ''} has been removed`);
  }
}
