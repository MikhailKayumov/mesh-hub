import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addSeconds } from 'date-fns';
import { Repository } from 'typeorm';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { ConfigService } from '@/modules/common/config/config.service';

@Injectable()
export class AuthRepository extends Repository<SessionEntity> {
  public constructor(
    @InjectRepository(SessionEntity)
    private readonly repository: Repository<SessionEntity>,
    private readonly configService: ConfigService,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async createSession(
    accessToken: string,
    refreshToken: string,
    user: UserEntity,
    ip: string,
    userAgent?: string,
  ) {
    const session = new SessionEntity();

    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
    session.user = user;
    session.expiredAt = addSeconds(new Date(), this.configService.jwt.refreshExpiresIn);
    session.ip = ip;
    session.userAgent = userAgent;

    return this.repository.save(session);
  }
}
