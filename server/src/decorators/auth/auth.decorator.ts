import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/guards/auth/jwt-auth.guard';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const JwtAuth = () => {
  // todo: implement user roles
  return applyDecorators(UseGuards(JwtAuthGuard));
};
