import { Routes } from '~/api/routes';
import ApiBase from '~/api/base';
import { ApiStorage } from '~/api/storage';
import { LoginDto, Session } from './types';

export class ApiAuth extends ApiBase {
  public async login(dto: LoginDto) {
    const session = await this.request<Session>(Routes.Login, {
      method: 'post',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    // ApiStorage.session = session;

    return session;
  }
}
