export function toFixed(number: number, precision: number) {
  const scale = 10 ** Math.round(Math.abs(precision));
  return Math.round(number * scale) / scale;
}
