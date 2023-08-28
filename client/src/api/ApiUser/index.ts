import { UserResponseDto } from '~/api/data-contracts';
import ApiBase from '../ApiBase';

export class ApiUser extends ApiBase {
  public async current(): Promise<UserResponseDto> {
    return await this.request<UserResponseDto>({ path: 'current' }).catch(error => {
      console.log(error);
      return null;
    });
  }
}
