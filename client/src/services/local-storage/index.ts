import { isNil, isObject } from '../../utils/type-guards';
import { ThemeMode } from '../../layouts/components/ThemeSwitcher';
import { LocalStorageKey, LocalStorageKeys } from './constants';

export class LocalStorageService {
  private static keyPrefix = 'APP_';

  private static keySuffix = '_KEY';

  public static get<T = string>(name: string, json = false): T | null {
    const data = localStorage.getItem(name);

    if (!data) return null;
    if (!json) return data as T;

    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Не удалось получить данные для ${name}`);
      return null;
    }
  }

  public static set<T = string>(name: string, value: T): void {
    if (isNil(value)) {
      return localStorage.removeItem(name);
    }

    if (isObject(value)) {
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch (e) {
        console.error(`Не удалось сохранить данные для ${name}`);
      }
    } else {
      localStorage.setItem(name, (value as any).toString());
    }
  }

  public static setTheme(name: ThemeMode | null | undefined): void {
    this.set(this.buildKey(LocalStorageKeys.Theme), name);
  }

  public static getTheme(): ThemeMode | null {
    return this.get<ThemeMode>(this.buildKey(LocalStorageKeys.Theme));
  }

  private static buildKey(key: LocalStorageKey): string {
    return `${this.keyPrefix}${key}${this.keySuffix}`;
  }
}
