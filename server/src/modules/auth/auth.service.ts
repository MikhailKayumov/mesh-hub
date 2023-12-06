import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Request } from 'express';
import { LessThan, MoreThanOrEqual } from 'typeorm';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { ConfigService } from '@/modules/common/config/config.service';
import { UserCreateRequestDto } from '@/modules/user/dto/user.create.request.dto';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { UserService } from '@/modules/user/user.service';
import { AuthMapper } from './auth.mapper';
import { AuthRepository } from './auth.repository';
import { LoginRequestDto } from './dto/login.request.dto';
import { SessionResponseDto } from './dto/session.response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  public constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  public async signup(dto: UserCreateRequestDto, request: Request): Promise<SessionResponseDto> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    request.session = await this.createSession(request, await this.userService.createUserEntity(dto));

    return AuthMapper.sessionEntityToResponse(request.session);
  }

  public async login({ email, password }: LoginRequestDto, request: Request): Promise<SessionResponseDto> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !(await this.userService.comparePassword(password, user.salt, user.password))) {
      throw new BadRequestException('Неверные email или пароль');
    }

    request.session = await this.createSession(request, user);

    return AuthMapper.sessionEntityToResponse(request.session);
  }

  public async logout(session: SessionEntity, request: Request): Promise<void> {
    request.session = null;
    this.authRepository.delete(session.id);
  }

  public async validateSession(token: string, userId: string, silent = false): Promise<SessionEntity | null> {
    let session = await this.authRepository.findOne({
      relations: {
        user: true,
      },
      where: {
        accessToken: token,
        user: {
          id: userId,
        },
        expiredAt: MoreThanOrEqual(new Date()),
      },
    });
    if ((!session || !session.user) && !silent) {
      throw new UnauthorizedException('Сессия не найдена или устарела');
    }

    const isValid = await this.validateAccessToken(token);
    if (session && !isValid) {
      session = await this.refreshSession(session);
    }

    return session;
  }

  public async refreshSession(session: SessionEntity): Promise<SessionEntity> {
    try {
      await this.jwtService.verifyAsync(session.refreshToken, {
        secret: this.configService.jwt.refreshSecret,
        algorithms: [this.configService.jwt.algorithm],
      });

      const [accessToken, refreshToken] = await this.createTokens(session.user);

      session.accessToken = accessToken;
      session.refreshToken = refreshToken;

      return await this.authRepository.save(session);
    } catch (e) {
      throw new UnauthorizedException('Сессия устарела');
    }
  }

  private async createSession(request: Request, user: UserEntity): Promise<SessionEntity> {
    const exitingSession = await this.authRepository.findOne({
      relations: { user: true },
      where: { user: { id: user.id }, ip: request.ip },
    });

    if (exitingSession) {
      return exitingSession;
    }

    const [accessToken, refreshToken] = await this.createTokens(user);

    return this.authRepository.createSession(
      accessToken,
      refreshToken,
      user,
      request.ip,
      request.headers['user-agent'],
    );
  }

  public async createTokens(user: UserEntity) {
    const payload = { userId: user.id, userEmail: user.email };

    return await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.jwt.refreshSecret,
        algorithm: this.configService.jwt.algorithm,
        expiresIn: this.configService.jwt.refreshExpiresIn,
      }),
    ]);
  }

  private async validateAccessToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch (e: unknown) {
      this.logger.warn('Access token has been expire');
      return false;
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  private async clearSessions(): Promise<void> {
    const { affected } = await this.authRepository.delete({
      expiredAt: LessThan(new Date()),
    });

    this.logger.log(`${affected ?? 0} expired session${(affected ?? 0) > 2 ? 's' : ''} has been removed`);
  }
}
