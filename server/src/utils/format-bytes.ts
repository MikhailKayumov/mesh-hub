export default function formatBytes(bytes: number, decimals?: number) {
  if (bytes == 0) return '0Б';

  const k = 1024;
  const dm = decimals || 2;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ', 'ПБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(dm).replace('.', ',')}${sizes[i]}`;
}
