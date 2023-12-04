import * as fs from 'fs';
import * as path from 'path';
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { format as dateFormat } from 'date-fns';
import { createLogger, format, transports, Logger } from 'winston';
import { FileTransportInstance } from 'winston/lib/winston/transports';
import { ConfigService } from '@/modules/common/config/config.service';
import { LoggerMessage } from '@/modules/common/logger/types';
import getConsoleRowFormat from '@/modules/common/logger/utils';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;

  constructor(private readonly configService: ConfigService) {
    this.logger = createLogger({
      level: configService.logging.level,
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp({ format: () => dateFormat(new Date(), 'dd.MM.yyyy HH:mm:ss.SSS') }),
            getConsoleRowFormat(),
          ),
        }),
        this.getFileTransport(),
      ].filter(Boolean) as any,
    });
  }

  public log(message: LoggerMessage, context?: string): any {
    if (!message) return;

    const { message: msg, level = 'info', ...meta } = typeof message === 'object' ? message : { message };
    return this.logger.log(level, msg, { context, meta });
  }

  public error(message: any, trace?: string, context?: string): any {
    if (!message) return;

    if (message instanceof Error) {
      const { message: msg, name, stack, ...meta } = message;

      return this.logger.error(msg, {
        context,
        stack: trace ?? stack,
        errorName: name,
        error: message,
        meta,
      });
    }

    if ('object' === typeof message) {
      const { message: msg, ...meta } = message;
      return this.logger.error(msg as string, { context, stack: trace, meta });
    }

    return this.logger.error(message, { context, stack: trace });
  }

  public warn(message: LoggerMessage, context?: string): any {
    const msg = typeof message === 'object' ? message : { message };
    this.log({ ...msg, level: 'warn' }, context);
  }

  public debug(message: any, context?: string): any {
    const msg = typeof message === 'object' ? message : { message };
    this.log({ ...msg, level: 'debug' }, context);
  }

  public verbose(message: any, context?: string): any {
    const msg = typeof message === 'object' ? message : { message };
    this.log({ ...msg, level: 'verbose' }, context);
  }

  private getFileTransport(): FileTransportInstance | undefined {
    if (!this.configService.logging.fileLoggingEnabled) return;

    const dirname = path.join(process.cwd(), '/.log');
    const filename = path.join(dirname, `/log.${dateFormat(new Date(), 'yyyyMMddHHmmss')}.txt`);

    if (!fs.existsSync(dirname)) fs.mkdirSync(dirname);

    try {
      fs.readdirSync(dirname).forEach((file) => fs.unlinkSync(path.join(dirname, file)));
    } catch {}

    return new transports.File({ filename });
  }
}
