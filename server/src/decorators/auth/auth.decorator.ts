import { SessionEntity } from '@entities/session/session.entity';
import { UserEntity } from '@entities/user/user.entity';
import { AuthGuard } from '@guards/auth/auth.guard';
import { applyDecorators, createParamDecorator, ExecutionContext, UseGuards } from '@nestjs/common';

export const Auth = () => applyDecorators(UseGuards(AuthGuard));

export const Session = createParamDecorator<any, any, SessionEntity>((data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().session;
});

export const SessionUser = createParamDecorator<any, any, UserEntity>((data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().session.user;
});
