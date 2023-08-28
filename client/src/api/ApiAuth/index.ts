import ApiBase from '~/api/ApiBase';
import { LoginRequestDto, SessionResponseDto } from '~/api/data-contracts';
import { HttpResponse, RequestParams } from '~/api/types';

export class ApiAuth extends ApiBase {
  public login(data: LoginRequestDto, params: RequestParams = {}): Promise<HttpResponse<SessionResponseDto>> {
    return this.request<SessionResponseDto>({
      path: `login`,
      method: 'POST',
      body: data,
      ...params,
    });
  }

  // public logout(params: RequestParams = {}): Promise<HttpResponse<void, HttpException>> {
  //   return this.httpService.request<void, HttpException>({
  //     path: `/api/auth/logout`,
  //     method: 'POST',
  //     ...params,
  //   });
  // }
}
