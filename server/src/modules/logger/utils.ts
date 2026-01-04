import { LogLevel } from '@nestjs/common';
import { Format } from 'logform';
import { format } from 'winston';
import { LoggerMeta, LoggerTransformableInfo } from './types';

function getRowColor(level: LogLevel): string {
  switch (level) {
    case 'debug':
      return '\u001b[34;1m';
    case 'warn':
      return '\u001b[33;1m';
    case 'error':
      return '\u001b[31;1m';
    case 'verbose':
      return '\u001b[36;1m';
    default:
      return '\u001b[32;1m';
  }
}

function parseMetaData(meta: LoggerMeta | undefined | null): [string, string?] {
  if (!meta) return [''];
  if (typeof meta !== 'object') return [meta.toString()];
  if (meta instanceof Error) return [meta.message, meta.stack];

  const result = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return [result];
}

export default function getConsoleRowFormat(): Format {
  let prevTimestamp = Date.now();

  return format.printf((info: LoggerTransformableInfo) => {
    const colorCode = getRowColor(info.level as LogLevel);
    const timestamp = `${colorCode}${info.timestamp}\u001b[0m`;
    const pid = `[PID: ${process.pid}]`;
    const level = `\u001b[1m${colorCode}${info.level.toUpperCase().padStart(7)}\u001b[0m`;
    const context = `[\u001b[1m${colorCode}${info.context ?? 'NestApplication'}\u001b[0m]`;
    const message = `${colorCode}${info.message}\u001b[0m`;
    const timestampDiff = `\u001b[33m+${Date.now() - prevTimestamp}ms\u001b[0m`;
    const [meta, trace] = parseMetaData(info.meta);

    prevTimestamp = Date.now();

    return `${timestamp} ${pid} ${level} ${context}: ${message} ${timestampDiff}${
      meta ? `\n=== Meta Data ===\n${meta}\n` : ''
    }${trace ? `\n=== Stacktrace ===\n${trace}\n` : ''}`;
  });
}
