import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  const mRedis = jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }));

  return {
    __esModule: true,
    default: mRedis,
  };
});

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: jest.Mocked<Redis>;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'redis.host') return 'localhost';
        if (key === 'redis.port') return 6379;
        if (key === 'redis.password') return 'pass';
        return undefined;
      }),
    };

    service = new CacheService(mockConfigService as ConfigService);
    mockRedis = (Redis as unknown as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to Redis with correct config', () => {
    expect(Redis).toHaveBeenCalledWith({
      host: 'localhost',
      port: 6379,
      password: 'pass',
    });

    expect(mockRedis.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should get parsed JSON from Redis', async () => {
    const key = 'test-key';
    const value = { message: 'hello' };
    mockRedis.get.mockResolvedValue(JSON.stringify(value));

    const result = await service.get<typeof value>(key);

    expect(mockRedis.get).toHaveBeenCalledWith(key);
    expect(result).toEqual(value);
  });

  it('should return null if value does not exist', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await service.get('not-found');
    expect(result).toBeNull();
  });

  it('should set value without TTL', async () => {
    const key = 'user:123';
    const value = { name: 'Alice' };

    await service.set(key, value);

    expect(mockRedis.set).toHaveBeenCalledWith(key, JSON.stringify(value));
  });

  it('should set value with TTL', async () => {
    const key = 'user:123';
    const value = { name: 'Bob' };

    await service.set(key, value, 60);

    expect(mockRedis.set).toHaveBeenCalledWith(
      key,
      JSON.stringify(value),
      'EX',
      60,
    );
  });

  it('should delete key', async () => {
    const key = 'delete-me';
    await service.del(key);

    expect(mockRedis.del).toHaveBeenCalledWith(key);
  });

  it('should flush all keys', async () => {
    await service.flushAll();

    expect(mockRedis.flushall).toHaveBeenCalled();
  });

  it('should quit Redis on module destroy', async () => {
    await service.onModuleDestroy();

    expect(mockRedis.quit).toHaveBeenCalled();
  });
});
