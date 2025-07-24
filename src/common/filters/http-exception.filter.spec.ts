import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionsFilter } from './http-exception.filter';

describe('HttpExceptionsFilter', () => {
  let filter: HttpExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/test',
      method: 'POST',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException with string message', () => {
    const exception = new HttpException(
      'Unauthorized',
      HttpStatus.UNAUTHORIZED,
    );
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Unauthorized',
        path: '/test',
        method: 'POST',
      }),
    );
  });

  it('should handle HttpException with object message', () => {
    const exception = new HttpException(
      { message: 'Invalid token' },
      HttpStatus.UNAUTHORIZED,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid token',
        path: '/test',
        method: 'POST',
      }),
    );
  });
});
