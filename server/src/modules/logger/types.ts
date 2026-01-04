import { LogLevel } from '@nestjs/common';
import { TransformableInfo } from 'logform';

export type LoggerMeta = string | number | Error | { [index: string | number]: any };

export type LoggerMessage =
  | string
  | {
      message: string;
      level?: LogLevel;
      [index: string | number]: any;
    };

export type LoggerErrorMessage =
  | Error
  | {
      message: string;
      level?: LogLevel;
      [index: string | number]: any;
    };

export type LoggerTransformableInfo = TransformableInfo & {
  message: string;
  timestamp: string;
  context: string;
  meta?: LoggerMeta | null;
};

export type LoggerMessagePayload = null | Record<string, any> | any[];
