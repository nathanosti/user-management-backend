import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      responseBody = exception.getResponse();
    }

    if (
      exception instanceof SyntaxError &&
      'body' in exception &&
      (exception as any).status === 400
    ) {
      status = HttpStatus.BAD_REQUEST;
      responseBody = `Malformed JSON: ${exception.message}`;
    }

    this.logger.error(
      `[${request.method}] ${request.url} ${status} → ${JSON.stringify(
        responseBody,
      )}`,
    );

    response.status(status).json({
      statusCode: status,
      message:
        typeof responseBody === 'string'
          ? responseBody
          : ((responseBody as any).message ?? responseBody),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
