import { HttpService } from '~/api/http.service';
import { FullRequestParams } from '~/api/types';

export default abstract class ApiBase {
  public constructor(
    public httpService: HttpService,
    private prefix: string = '',
  ) {}

  public async request<T = any>(params: FullRequestParams): Promise<any> {
    return this.httpService.request<T>({
      ...params,
      path: `${this.prefix ? `${this.prefix}/` : ''}${params.path}`,
    });
  }
}
