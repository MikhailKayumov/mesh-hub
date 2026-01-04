import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserEntity } from '@/database/entities/user/user.entity';

export const User = createParamDecorator<keyof UserEntity, UserEntity | UserEntity[keyof UserEntity]>(
  (data: keyof UserEntity, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<Request>().session?.user;

    if (!user) {
      throw new Error('User not found!');
    }

    return data && data in user ? user[data] : user;
  },
);

export const OptionalUser = createParamDecorator<
  keyof UserEntity,
  UserEntity | UserEntity[keyof UserEntity] | undefined
>((data: keyof UserEntity, ctx: ExecutionContext) => {
  const user = ctx.switchToHttp().getRequest<Request>().session?.user;
  return user && data && data in user ? user?.[data] : user;
});
