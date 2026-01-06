import type { UserCurrentResponseDto } from '@/app/api/dto.ts';

export const AVATAR_PATH_PREFIX = '/api/user/avatar';

export function getAvatarInitials(user: UserCurrentResponseDto): string {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

export function getInitials(user: UserCurrentResponseDto): string {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

export function getUserFullName(user: UserCurrentResponseDto, withMiddleName = false): string {
  return `${user.firstName}${withMiddleName && user.middleName ? ` ${user.middleName}` : ''} ${user.lastName}`;
}

export function getAvatarSrc(user: UserCurrentResponseDto | null): string | null {
  return getAvatarSrcByString(user?.meta?.avatar);
}

export function getAvatarSrcByString(src?: string): string | null {
  return src ? `${AVATAR_PATH_PREFIX}/${src}` : null;
}
