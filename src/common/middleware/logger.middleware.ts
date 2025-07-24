import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      let logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const safeBody = { ...body };

        if ('password' in safeBody) safeBody.password = '[REDACTED]';
        if ('confirmPassword' in safeBody)
          safeBody.confirmPassword = '[REDACTED]';

        logMessage += ` | Body: ${JSON.stringify(safeBody)}`;
      }

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
