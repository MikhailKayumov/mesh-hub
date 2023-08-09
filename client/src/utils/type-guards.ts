export function isNil(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(object: unknown): object is Record<any, any> {
  return typeof object === 'object' && object !== null;
}
