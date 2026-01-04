import { HttpException } from '@nestjs/common';
import { HttpExceptionOptions } from '@nestjs/common/exceptions/http.exception';

export class AppHttpException extends HttpException {
  public readonly type: string | undefined;

  public constructor(response: string | Record<string, any>, status?: number, options?: HttpExceptionOptions) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    super(response, typeof response === 'object' ? response.status : status, options);

    if (typeof response === 'object') {
      this.type = response.type;
    }
  }
}
