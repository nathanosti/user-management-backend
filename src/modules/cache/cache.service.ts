import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port');
    const password = this.configService.get<string>('redis.password');

    this.redis = new Redis({
      host,
      port,
      password,
    });

    this.redis.on('connect', () =>
      this.logger.log('Redis conectado com sucesso.'),
    );
    this.redis.on('error', (err) => this.logger.error('Erro no Redis', err));
  }

  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T = any>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.set(key, data, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, data);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async flushAll(): Promise<void> {
    await this.redis.flushall();
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
