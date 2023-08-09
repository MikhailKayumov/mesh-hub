import { ConfigService } from '@config/config.service';
import { SessionEntity } from '@entities/session/session.entity';
import { UserEntity } from '@entities/user/user.entity';
import { AuthMapper } from '@modules/auth/auth.mapper';
import { AuthRepository } from '@modules/auth/auth.repository';
import { LoginRequestDto } from '@modules/auth/dto/login.request.dto';
import { RefreshRequestDto } from '@modules/auth/dto/refresh.request.dto';
import { SessionResponseDto } from '@modules/auth/dto/session.response.dto';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { UserRepository } from '@modules/user/user.repository';
import { UserService } from '@modules/user/user.service';
import { HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, MoreThanOrEqual } from 'typeorm';

export interface ValidateSessionProps {
  token: string;
  userId: string;
}

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

  public async login({ email, password }: LoginRequestDto): Promise<SessionResponseDto> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await this.userService.comparePassword(password, user.salt, user.password))) {
      throw new HttpException('Неверные логин или пароль', HttpStatus.NOT_FOUND);
    }

    return AuthMapper.sessionEntityToResponse(await this.createSession(user));
  }

  public async refresh({ token, userId }: RefreshRequestDto): Promise<SessionResponseDto> {
    const session = await this.validateSession(token, userId);
    this.authRepository.delete(session.id);
    return AuthMapper.sessionEntityToResponse(await this.createSession(session.user));
  }

  public async createSession(user: UserEntity): Promise<SessionEntity> {
    const sessions = await this.authRepository.find({
      where: { user: { id: user.id } },
    });
    if (sessions && sessions.length) {
      await Promise.all(sessions.map(({ id }) => this.authRepository.delete({ id })));
    }

    const accessToken = await this.jwtService.signAsync({
      userId: user.id,
      userEmail: user.email,
    });
    const refreshToken = await this.jwtService.signAsync(
      {
        userId: user.id,
        userEmail: user.email,
      },
      {
        secret: this.configService.jwt.refreshSecret,
        algorithm: this.configService.jwt.algorithm,
        expiresIn: this.configService.jwt.refreshExpiresIn,
      },
    );

    return this.authRepository.createSession(accessToken, refreshToken, user);
  }

  public async validateSession(token: string, userId: string): Promise<SessionEntity> {
    const session = await this.authRepository.findOne({
      where: {
        accessToken: token,
        user: { id: userId },
        expiredAt: MoreThanOrEqual(new Date()),
      },
      relations: {
        user: true,
      },
    });

    if (
      !session ||
      !session.user ||
      !(await this.jwtService.verifyAsync(session.refreshToken, {
        secret: this.configService.jwt.refreshSecret,
        algorithms: [this.configService.jwt.algorithm],
      }))
    ) {
      throw new UnauthorizedException();
    }

    return session;
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  public async clearSessions() {
    const { affected } = await this.authRepository.delete({
      expiredAt: LessThan(new Date()),
    });

    this.logger.debug(`Removed ${affected} expired session`);
  }
}
