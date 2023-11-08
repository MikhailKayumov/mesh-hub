import { UserEntity } from '@entities/user/user.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator<keyof UserEntity, any, UserEntity>(
  (data: keyof UserEntity, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().session.user;
    return data && data in user ? user[data] : user;
  },
);
