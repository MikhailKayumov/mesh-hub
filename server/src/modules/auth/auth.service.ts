import { ConfigService } from '@config/config.service';
import { SessionEntity } from '@entities/session/session.entity';
import { UserEntity } from '@entities/user/user.entity';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { UserRepository } from '@modules/user/user.repository';
import { UserService } from '@modules/user/user.service';
import { HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Request } from 'express';
import { LessThan, MoreThanOrEqual } from 'typeorm';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
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

  public async signup(dto: UserCreateRequestDto): Promise<SessionResponseDto> {
    const { hash, salt } = await this.userService.encodePassword(dto.password);
    const user = await this.userRepository.createUser(dto, hash, salt);

    return AuthMapper.sessionEntityToResponse(await this.createSession(user));
  }

  public async login(
    { email, password }: LoginRequestDto,
    request: Request & { session?: SessionEntity },
  ): Promise<SessionResponseDto> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !(await this.userService.comparePassword(password, user.salt, user.password))) {
      throw new HttpException('Неверные логин или пароль', HttpStatus.NOT_FOUND);
    }

    request.session = await this.createSession(user);

    return AuthMapper.sessionEntityToResponse(request.session);
  }

  public async logout(session: SessionEntity): Promise<void> {
    await this.authRepository.delete(session.id);
  }

  public async refresh(
    session: SessionEntity,
    request: Request & { session?: SessionEntity },
  ): Promise<SessionResponseDto> {
    try {
      await this.jwtService.verifyAsync(session.refreshToken, {
        secret: this.configService.jwt.refreshSecret,
        algorithms: [this.configService.jwt.algorithm],
      });

      request.session = await this.createSession(session.user, session.id);

      return AuthMapper.sessionEntityToResponse(request.session);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  public async createSession(user: UserEntity, sessionId?: string): Promise<SessionEntity> {
    const where: FindOptionsWhere<SessionEntity> = { user: { id: user.id } };
    if (sessionId) {
      (where as any).id = sessionId;
    }
    await this.authRepository.delete(where);

    const payload = { userId: user.id, userEmail: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.jwt.refreshSecret,
        algorithm: this.configService.jwt.algorithm,
        expiresIn: this.configService.jwt.refreshExpiresIn,
      }),
    ]);

    return this.authRepository.createSession(accessToken, refreshToken, user);
  }

  public async validateSession(token: string, userId: string): Promise<SessionEntity> {
    const session = await this.authRepository.findOne({
      where: {
        accessToken: token,
        user: {
          id: userId,
        },
        expiredAt: MoreThanOrEqual(new Date()),
      },
      relations: {
        user: true,
      },
    });
    if (!session || !session.user) {
      throw new UnauthorizedException();
    }

    return session;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  public async clearSessions(): Promise<void> {
    const { affected } = await this.authRepository.delete({
      expiredAt: LessThan(new Date()),
    });

    this.logger.log(`${affected ?? 0} expired session${(affected ?? 0) > 2 ? 's' : ''} has been removed`);
  }
}
