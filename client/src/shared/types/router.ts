import { type generatePath } from 'react-router-dom';

export interface BuildRoutePathOptions {
  params?: Parameters<typeof generatePath>[1];
  search?: Record<string, string | number | Array<string | number>>;
  absolute?: boolean;
}
