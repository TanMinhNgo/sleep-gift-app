import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    let status = 500;
    let error = 'internal';
    if (exception instanceof HttpException && exception.getStatus() < 500) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : (body as { message?: unknown }).message;
      error = Array.isArray(message)
        ? message.join('; ')
        : typeof message === 'string'
          ? message
          : exception.message;
    } else {
      const code = (exception as { code?: string } | null)?.code;
      if (code === '23505') {
        status = 409;
        error = 'conflict';
      } else if (code && ['23514', '22P02', '22007', '22008'].includes(code)) {
        status = 400;
        error = 'invalid data';
      }
      // Do not log driver errors: they may contain SQL parameters and token hashes.
      if (status === 500) this.logger.error('Unhandled server error');
    }
    host.switchToHttp().getResponse<Response>().status(status).json({ error });
  }
}
