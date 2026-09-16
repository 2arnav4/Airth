import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * Turns every error into one predictable JSON shape.
 *
 * Without this, a validation error, a 409 and an unexpected crash all come
 * back looking different, and an unexpected crash can leak a database error
 * message to the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const body =
      exception instanceof HttpException
        ? this.fromHttpException(exception, request.url)
        : this.fromUnknown(exception, request.url);

    response.status(body.statusCode).json(body);
  }

  /** Errors we threw on purpose: NotFoundException, ConflictException, validation. */
  private fromHttpException(exception: HttpException, path: string): ErrorBody {
    const status = exception.getStatus();
    const payload = exception.getResponse();

    const message =
      typeof payload === 'string'
        ? payload
        : ((payload as { message?: string | string[] }).message ??
          exception.message);

    return {
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      message,
      path,
      timestamp: new Date().toISOString(),
    };
  }

  /** Anything unplanned: a bug, a dropped database connection. */
  private fromUnknown(exception: unknown, path: string): ErrorBody {
    this.logger.error(
      `Unhandled error on ${path}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      // Deliberately generic: never leak internals to the client.
      message: 'Something went wrong',
      path,
      timestamp: new Date().toISOString(),
    };
  }
}
