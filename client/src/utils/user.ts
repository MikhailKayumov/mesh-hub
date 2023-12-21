import { UserCurrentResponseDto } from '@/api/dto.ts';

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
  return user && user.meta.avatar ? `/files/avatars/${user.meta.avatar}` : null;
}

export function getAvatarSrcByString(src?: string): string | null {
  return src ? `/files/avatars/${src}` : null;
}
