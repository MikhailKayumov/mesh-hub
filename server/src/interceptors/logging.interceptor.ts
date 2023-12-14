import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  InternalServerErrorException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('LoggingInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      return this.loggingHttpCall(context, next);
    } else {
      throw new InternalServerErrorException();
    }
  }

  private loggingHttpCall(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.get('user-agent') ?? 'Unknown user agent';
    const { method, path: url, ip } = request;

    this.logger.log(`${method} ${url} ${userAgent} ${ip}: ${context.getClass().name}::${context.getHandler().name}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.logger.log(`${method} ${url} ${response?.statusCode ?? ''}`);
        },
        error: (err: unknown) => {
          let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          let message = 'Unknown internal server error';

          if (err instanceof HttpException) {
            statusCode = err.getStatus();
            message = err.message;
          }

          this.logger.error(`${method} ${url} ${statusCode} ${message}`);
        },
      }),
    );
  }
}
