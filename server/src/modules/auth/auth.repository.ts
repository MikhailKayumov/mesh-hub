import { ConfigService } from '@config/config.service';
import { SessionEntity } from '@entities/session/session.entity';
import { UserEntity } from '@entities/user/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addSeconds } from 'date-fns';
import { Repository } from 'typeorm';

@Injectable()
export class AuthRepository extends Repository<SessionEntity> {
  public constructor(
    @InjectRepository(SessionEntity)
    private readonly repository: Repository<SessionEntity>,
    private readonly configService: ConfigService,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async createSession(accessToken: string, refreshToken: string, user: UserEntity) {
    const session = new SessionEntity();

    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
    session.user = user;
    session.expiredAt = addSeconds(new Date(), this.configService.jwt.refreshExpiresIn);

    return this.repository.save(session);
  }
}
