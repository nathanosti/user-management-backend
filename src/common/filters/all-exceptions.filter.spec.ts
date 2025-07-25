import { AllExceptionsFilter } from './all-exceptions.filter';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockReq: Request;
  let mockRes: Response;
  let mockHost: ArgumentsHost;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockReq = {
      method: 'GET',
      url: '/test',
    } as Request;

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
    } as unknown as Response;

    const httpContext = {
      getRequest: () => mockReq,
      getResponse: () => mockRes,
      getNext: () => undefined,
    };

    mockHost = {
      switchToHttp: () => httpContext,
    } as ArgumentsHost;

    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle HttpException properly', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Not Found',
      path: '/test',
      timestamp: expect.any(String),
    });
    expect(loggerSpy).toHaveBeenCalledWith('[GET] /test 404 → "Not Found"');
  });

  it('should handle SyntaxError with body and status 400', () => {
    const syntaxError = Object.assign(new SyntaxError('Unexpected token'), {
      body: true,
      status: 400,
    });

    filter.catch(syntaxError, mockHost);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 400,
      message: expect.stringContaining('Malformed JSON'),
      path: '/test',
      timestamp: expect.any(String),
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('[GET] /test 400 →'),
    );
  });

  it('should handle unknown error as 500', () => {
    const error = new Error('Unknown failure');

    filter.catch(error, mockHost);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      path: '/test',
      timestamp: expect.any(String),
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      '[GET] /test 500 → "Internal server error"',
    );
  });
});
