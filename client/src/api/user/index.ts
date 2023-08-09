import ApiBase from '../base';
import { User } from './types';

export class ApiUser extends ApiBase {
  public async current() {
    const data = await this.request('user', {
      cache: 'no-cache',
    });
    // await sleep(15);
    return data;
  }
}

const apiUser = new ApiUser();
export default apiUser;
