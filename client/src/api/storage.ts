import { Session } from '~/api/auth/types';

export interface ApiStorageData {
  session?: Session;
}

export class ApiStorage {
  private static data: ApiStorageData = {};

  public static set session(newSession: Session) {
    this.data.session = newSession;
  }

  public static get session(): Session | undefined {
    return this.data.session;
  }
}
