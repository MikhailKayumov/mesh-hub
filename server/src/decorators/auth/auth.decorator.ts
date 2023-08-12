import { JwtAuthGuard } from '@guards/auth/jwt-auth.guard';
import { JwtRefreshAuthGuard } from '@guards/auth/jwt-refresh-auth.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';

export const JwtAuth = () => {
  // todo: implement user roles
  return applyDecorators(UseGuards(JwtAuthGuard));
};

export const JwtRefreshAuth = () => applyDecorators(UseGuards(JwtRefreshAuthGuard));
