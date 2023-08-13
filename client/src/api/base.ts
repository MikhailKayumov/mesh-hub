import { NextResponse } from 'next/server';
import { Route, Routes } from '~/api/routes';
import DotEnv from '~/utils/env';
import { ApiStorage } from '~/api/storage';

// export interface ServiceOptions {
//   prefix?: string;
// }

// const mutex = new Mutex();

export default abstract class ApiBase {
  protected host: string = DotEnv.get('SERVER_HOST', 'http://localhost');
  protected port: number = DotEnv.getNumber('SERVER_PORT', 8000);

  public async request<T = any>(route: Route | Route[] = [], options: RequestInit = {}) /*: Promise<[T, Response]>*/ {
    // await mutex.waitForUnlock();

    options.headers = this.prepareHeaders(options?.headers);

    const response: Response = await fetch(this.buildUrl(route), options);

    if (response.status === 401) {
      // const release = await mutex.acquire();
      //
      // const response = await fetch(this.buildUrl([Routes.Auth, Routes.Refresh], false), {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token: session?.token }),
      // });
      //
      // const data = await response.json();
      // console.log([data, response]);
      //
      // release();

      // todo: refresh
      // LocalStorageService.removeSession();
      throw new Error('Вы не авторизованы');
    }

    if (response.ok) {
      const data = await response.json();
      return [data as T, response];
    }

    throw new Error('Неизвестная ошибка.');
  }

  public buildUrl(route: Route | Route[] = []) {
    const routes = Array.isArray(route) ? route : [route];
    const path = routes
      .reduce<string[]>((acc, r) => {
        const route = r.trim().replace(/\/+/gm, '');
        acc.push(route);
        return acc;
      }, [])
      .filter(r => !!r)
      .join('/');

    return `${this.host}:${this.port}/${path}`;
  }

  private prepareHeaders(headersInit: HeadersInit = {}): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...headersInit,
    });

    const session = ApiStorage.session;
    if (session) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }

    return headers;
  }
}
