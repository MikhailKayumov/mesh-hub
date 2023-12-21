export interface FormatBytesOptions {
  precision?: number;
  forceDecimal?: boolean;
}

const SIZES = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ', 'ПБ'];
const BASE = 1024;

export default function formatBytes(bytes: number, { precision = 2, forceDecimal = false }: FormatBytesOptions = {}) {
  if (bytes === 0) {
    return forceDecimal ? `0,${'0'.repeat(precision)}Б` : '0Б';
  }

  const exponent = Math.floor(Math.log(bytes) / Math.log(BASE));
  const formatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: forceDecimal ? precision : 0,
    maximumFractionDigits: precision,
  });

  return `${formatter.format(bytes / Math.pow(BASE, exponent))}${SIZES[exponent]}`;
}
