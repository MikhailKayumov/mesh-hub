export const TRUTHY_ENV_VALUES = ['true', '1', 'on'];

export function getBoolean(name: keyof ImportMetaEnv): boolean {
  return TRUTHY_ENV_VALUES.includes(import.meta.env[name]);
}
