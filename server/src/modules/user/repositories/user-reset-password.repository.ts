import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addSeconds } from 'date-fns';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { UserResetPasswordEntity } from '@/database/entities/user/user-reset-password.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { ConfigService } from '@/modules/config/config.service';

@Injectable()
export class UserResetPasswordRepository extends Repository<UserResetPasswordEntity> {
  public constructor(
    @InjectRepository(UserResetPasswordEntity)
    private repository: Repository<UserResetPasswordEntity>,
    private readonly configService: ConfigService,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async getById(id: string) {
    return this.findOne({
      relations: { user: true },
      where: { id, expiredAt: MoreThan(new Date()) },
    });
  }

  public async createRequest(user: UserEntity) {
    const addedSeconds = this.configService.getNumber('RESET_PASSWORD_EXPIRE_SECONDS', 3600);

    const request = new UserResetPasswordEntity();
    request.user = user;
    request.expiredAt = addSeconds(new Date(), Math.max(1, addedSeconds));

    return this.save(request);
  }

  public async deleteExpiredByUser(user: UserEntity) {
    await this.delete({
      user: { id: user.id },
      expiredAt: LessThanOrEqual(new Date()),
    });
  }
}
