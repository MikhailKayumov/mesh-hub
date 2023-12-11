import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '@/database/entities/user/user.entity';

export const User = createParamDecorator<keyof UserEntity, any, UserEntity>(
  (data: keyof UserEntity, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().session?.user;
    return data && data in user ? user[data] : user;
  },
);
