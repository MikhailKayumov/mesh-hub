import { LogLevel } from '@nestjs/common';

export type LoggerMessage =
  | string
  | {
      message: string;
      level?: LogLevel;
      [index: string | number]: any;
    };

export type LoggerMessagePayload = null | Record<string, any> | any[];
