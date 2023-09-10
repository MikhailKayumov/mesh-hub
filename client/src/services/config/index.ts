import DotEnv from '../../utils/env';

export default class Config {
  public static get baseUrl(): string {
    const host = DotEnv.get('REACT_APP_API_HOST', 'http:/localhost');
    const port = DotEnv.getNumber('REACT_APP_API_PORT', 8000);
    const prefix = DotEnv.get('REACT_APP_API_PREFIX', '');

    return `${host}:${port}/${prefix}/`;
  }

  public static get isProduction(): boolean {
    return DotEnv.get('REACT_APP_ENV', 'development') === 'production';
  }

  public static get(name: string, defaultValue?: string): string {
    return DotEnv.get(name, defaultValue);
  }
}
