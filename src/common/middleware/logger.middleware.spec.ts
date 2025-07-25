import { LoggerMiddleware } from './logger.middleware';
import { LoggerService } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

describe('LoggerMiddleware', () => {
  let logger: LoggerService;
  let middleware: LoggerMiddleware;

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerService;

    middleware = new LoggerMiddleware(logger);

    mockReq = {
      method: 'POST',
      originalUrl: '/test',
      body: {
        username: 'testuser',
        password: 'secret',
        confirmPassword: 'secret',
      },
    };

    mockRes = {
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') callback();
        return mockRes as Response;
      }),
    } as unknown as Response;

    next = jest.fn();
  });

  it('should call logger.log for 2xx responses and redact sensitive fields', () => {
    mockRes.statusCode = 200;

    middleware.use(
      mockReq as Request,
      mockRes as Response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledTimes(1);

    const [message, payload, context] = (logger.log as jest.Mock).mock.calls[0];

    expect(message).toContain('[POST] /test 200');
    expect(context).toBe('LoggerMiddleware');

    const parsedPayload = JSON.parse(payload);

    expect(parsedPayload).toMatchObject({
      method: 'POST',
      url: '/test',
      statusCode: 200,
      duration: expect.stringMatching(/^\d+ms$/),
      body: {
        username: 'testuser',
        password: '[REDACTED]',
        confirmPassword: '[REDACTED]',
      },
    });
  });

  it('should call logger.warn for 4xx responses', () => {
    mockRes.statusCode = 404;

    middleware.use(
      mockReq as Request,
      mockRes as Response,
      next as NextFunction,
    );

    expect(logger.warn).toHaveBeenCalledTimes(1);

    const [message, payload, context] = (logger.warn as jest.Mock).mock
      .calls[0];

    expect(message).toContain('[POST] /test 404');
    expect(context).toBe('LoggerMiddleware');

    const parsedPayload = JSON.parse(payload);
    expect(parsedPayload.statusCode).toBe(404);
  });

  it('should call logger.error for 5xx responses', () => {
    mockRes.statusCode = 500;

    middleware.use(
      mockReq as Request,
      mockRes as Response,
      next as NextFunction,
    );

    expect(logger.error).toHaveBeenCalledTimes(1);

    const [message, payload, context] = (logger.error as jest.Mock).mock
      .calls[0];

    expect(message).toContain('[POST] /test 500');
    expect(context).toBe('LoggerMiddleware');

    const parsedPayload = JSON.parse(payload);
    expect(parsedPayload.statusCode).toBe(500);
  });

  it('should not include body for GET requests', () => {
    mockReq.method = 'GET';
    mockRes.statusCode = 200;

    middleware.use(
      mockReq as Request,
      mockRes as Response,
      next as NextFunction,
    );

    expect(logger.log).toHaveBeenCalledTimes(1);
    const [, payload] = (logger.log as jest.Mock).mock.calls[0];
    const parsedPayload = JSON.parse(payload);

    expect(parsedPayload.body).toBeUndefined();
  });
});
