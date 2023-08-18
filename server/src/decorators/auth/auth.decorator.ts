import { JwtAuthGuard } from '@guards/auth/jwt-auth.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';

export const JwtAuth = () => {
  // todo: implement user roles
  return applyDecorators(UseGuards(JwtAuthGuard));
};
