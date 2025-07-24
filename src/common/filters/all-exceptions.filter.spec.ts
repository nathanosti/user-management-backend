import { AllExceptionsFilter } from './all-exceptions.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/test',
      method: 'GET',
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

  it('should handle HttpException', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(403);

    const jsonResponse = mockResponse.json.mock.calls[0][0];
    expect(jsonResponse.statusCode).toBe(403);
    expect(jsonResponse.message).toBe('Forbidden');
    expect(jsonResponse.method).toBe('GET');
    expect(jsonResponse.path).toBe('/test');
    expect(typeof jsonResponse.timestamp).toBe('string');
  });

  it('should handle generic Error', () => {
    const error = new Error('Unexpected error');
    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);

    const jsonResponse = mockResponse.json.mock.calls[0][0];
    expect(jsonResponse.statusCode).toBe(500);
    expect(jsonResponse.message).toBe('Unexpected error');
    expect(jsonResponse.method).toBe('GET');
    expect(jsonResponse.path).toBe('/test');
    expect(typeof jsonResponse.timestamp).toBe('string');
  });

  it('should handle unknown exception', () => {
    const exception = 'some string';
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);

    const jsonResponse = mockResponse.json.mock.calls[0][0];
    expect(jsonResponse.statusCode).toBe(500);
    expect(jsonResponse.message).toBe('Internal server error');
    expect(jsonResponse.method).toBe('GET');
    expect(jsonResponse.path).toBe('/test');
    expect(typeof jsonResponse.timestamp).toBe('string');
  });
});
