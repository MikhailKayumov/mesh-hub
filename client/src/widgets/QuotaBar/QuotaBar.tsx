import { Progress, Text } from '@mantine/core';
import classes from './QuotaBar.module.scss';

export interface QuotaBarProps {
  used: number;
  limit: number | null;
  unit?: 'bytes' | 'count';
  label?: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} ГБ`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${bytes} Б`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatValue(value: number, unit: 'bytes' | 'count'): string {
  return unit === 'bytes' ? formatBytes(value) : formatCount(value);
}

function getColor(ratio: number): string {
  if (ratio >= 0.8) return 'red';
  if (ratio >= 0.6) return 'yellow';
  return 'green';
}

export function QuotaBar({ used, limit, unit = 'bytes', label }: QuotaBarProps) {
  if (limit === null) {
    return (
      <div className={classes.barWrap}>
        {label && <Text className={classes.label}>{label}</Text>}
        <Text size="sm">Без ограничений</Text>
      </div>
    );
  }

  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  const percent = Math.round(ratio * 100);
  const color = getColor(ratio);

  return (
    <div className={classes.barWrap}>
      {label && <Text className={classes.label}>{label}</Text>}
      <Progress value={percent} color={color} size="sm" />
      <Text size="xs" c="dimmed">
        {formatValue(used, unit)} / {formatValue(limit, unit)}
      </Text>
    </div>
  );
}
