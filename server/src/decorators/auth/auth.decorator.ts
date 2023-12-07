import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserRole } from '@/constants';
import { JwtAuthGuard } from '@/guards/auth/jwt-auth.guard';

export const IS_PUBLIC_KEY = 'isPublic';
export const ALLOWED_ROLES_KEY = 'allowedRoles';
export const ALLOWED_ROLES_MODE_KEY = 'allowedRolesMode';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (roles: UserRole[], mode: 'weights' | 'some' | 'every' = 'some') => {
  return applyDecorators(
    SetMetadata(ALLOWED_ROLES_KEY, roles), //
    SetMetadata(ALLOWED_ROLES_MODE_KEY, mode),
  );
};

export const AuthGuard = () => {
  return applyDecorators(
    UseGuards(JwtAuthGuard), //
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
  );
};
