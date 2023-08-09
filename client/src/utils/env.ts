import { isNumber } from '~/utils/type-guards';

class DotEnv {
  public static get(name: string, defaultValue?: string): string {
    if (!process.env[name] && typeof defaultValue === 'undefined') {
      throw new Error(`Environment variable ${name} is not found.`);
    }

    return process.env[name] ?? (defaultValue as string);
  }

  public static getNumber(name: string, defaultValue?: number): number {
    const value = Number(this.get(name, defaultValue ? '' : undefined));

    if (!isNumber(value) && !isNumber(defaultValue)) {
      throw new Error(`Environment variable ${name} must be number.`);
    }

    return isNaN(value) ? (defaultValue as number) : value;
  }
}

export default DotEnv;
