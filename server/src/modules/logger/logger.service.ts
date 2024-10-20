import * as fs from 'fs';
import * as path from 'path';
import { format as dateFormat } from 'date-fns';
import { createLogger, format, transports, Logger } from 'winston';
import { FileTransportInstance } from 'winston/lib/winston/transports';
import { ConfigService } from '@/modules/config/config.service';
import { LoggerMessage } from '@/modules/logger/types';
import getConsoleRowFormat from '@/modules/logger/utils';

export class AppLogger {
  private logger: Logger;
  private context: string | undefined;

  public constructor(private readonly configService: ConfigService) {
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

    return this.logger.log(level, msg, { context: context ?? this.context, meta });
  }

  public error(message: any, trace?: string, context?: string): any {
    if (!message) return;

    let msg = null;
    let meta = null;

    switch (true) {
      case message instanceof Error:
        msg = message.message;
        meta = {
          stack: trace ?? message.stack,
          errorName: message.name,
          error: message,
        };
        break;
      case typeof message === 'object':
        msg = message.message;
        break;
    }

    return this.logger.error(msg ?? message, {
      context: context ?? this.context,
      stack: trace,
      ...meta,
    });
  }

  public warn(message: LoggerMessage, context?: string): any {
    const msg = typeof message === 'object' ? message : { message };
    return this.log({ ...msg, level: 'warn' }, context);
  }

  public debug(message: any, context?: string): any {
    const msg = typeof message === 'object' ? message : { message };
    return this.log({ ...msg, level: 'debug' }, context);
  }

  public verbose(message: any, context?: string): any {
    const msg = typeof message === 'object' ? message : { message };
    return this.log({ ...msg, level: 'verbose' }, context);
  }

  public setContext(context?: string): void {
    this.context = context;
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
