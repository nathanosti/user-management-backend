import type { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const winstonConfig: WinstonModuleOptions = {
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'user-management-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple(),
        winston.format.printf(
          ({ timestamp, level, message, context, stack }) => {
            return `${timestamp} [${context || 'Application'}] ${level}: ${message}${stack ? `\n${stack}` : ''}`;
          },
        ),
      ),
    }),

    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
  exitOnError: false,
};
