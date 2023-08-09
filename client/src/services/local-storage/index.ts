import { ThemeModeName } from '~/theme/type';
import { LocalStorageKey, LocalStorageKeys } from './constants';

export class LocalStorageService {
  private static keyPrefix = 'APP_';

  private static keySuffix = '_KEY';

  public static setTheme(name: ThemeModeName) {
    localStorage.setItem(this.buildKey(LocalStorageKeys.Theme), name);
  }

  public static getTheme(): ThemeModeName | null {
    return localStorage.getItem(this.buildKey(LocalStorageKeys.Theme)) as ThemeModeName;
  }

  private static buildKey(key: LocalStorageKey): string {
    return `${this.keyPrefix}${key}${this.keySuffix}`;
  }
}
