export function shallowDiffObjects(a: Record<any, any>, b: Record<any, any>) {
  const keys = new Set(Object.keys(a).concat(Object.keys(b)));

  const same: Record<any, any> = {};
  const diff: Record<any, any> = {};

  keys.forEach((key) => {
    if (a[key] === b[key]) {
      same[key] = a[key];
    } else {
      diff[key] = [a[key], b[key]];
    }
  });

  return {
    same,
    diff,
  };
}
