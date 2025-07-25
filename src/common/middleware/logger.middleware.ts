import {
  Injectable,
  NestMiddleware,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      const safeBody = { ...body };
      if ('password' in safeBody) safeBody.password = '[REDACTED]';
      if ('confirmPassword' in safeBody)
        safeBody.confirmPassword = '[REDACTED]';

      const logPayload = {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ...(method === 'POST' || method === 'PUT' || method === 'PATCH'
          ? { body: safeBody }
          : {}),
      };

      const logMessage = `[${method}] ${originalUrl} ${statusCode} - ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(
          logMessage,
          JSON.stringify(logPayload),
          'LoggerMiddleware',
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          logMessage,
          JSON.stringify(logPayload),
          'LoggerMiddleware',
        );
      } else {
        this.logger.log(
          logMessage,
          JSON.stringify(logPayload),
          'LoggerMiddleware',
        );
      }
    });

    next();
  }
}
