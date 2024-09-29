import { generatePath } from 'react-router-dom';
import { BuildRoutePathOptions } from '../types/router';

export function buildPath(
  route: string | string[],
  { params, search, absolute = false }: BuildRoutePathOptions = {},
): string {
  let path = generatePath(Array.isArray(route) ? route.join('/') : route, params);

  if (search) {
    const searchParams = Object.entries(search);

    if (searchParams.length) {
      path = `${path}?`;

      for (let i = 0; i < searchParams.length; i++) {
        const [key, rawValue] = searchParams[i];
        if (!rawValue) continue;

        const value = Array.isArray(rawValue) ? rawValue.join(',') : rawValue;

        path = `${path}${key}=${value}${i + 1 < searchParams.length ? '&' : ''}`;
      }
    }
  }

  return `${absolute ? '/' : ''}${path.startsWith('/') ? path.slice(1) : path}`;
}

export function buildAbsolutePath(
  route: string | string[],
  options: Omit<BuildRoutePathOptions, 'absolute'> = {},
): string {
  return buildPath(route, { ...options, absolute: true });
}

export function canNavigateBack() {
  return 'history' in window && history.state && history.state.idx > 0;
}
