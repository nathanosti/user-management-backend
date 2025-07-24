import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<{
    log: Array<{ emit: 'event'; level: 'query' | 'info' | 'warn' | 'error' }>;
  }>
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.$on('query', (e: any) => {
      this.logger.debug(
        `Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`,
      );
    });

    this.$on('error', (e: any) => {
      this.logger.error(`Error: ${e.message}`);
    });

    this.$on('info', (e: any) => {
      this.logger.log(`Info: ${e.message}`);
    });

    this.$on('warn', (e: any) => {
      this.logger.warn(`Warning: ${e.message}`);
    });

    process.on('beforeExit', async () => {
      this.logger.log('Process beforeExit triggered - Prisma disconnecting...');
      await this.$disconnect();
    });

    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      this.logger.log('Shutting down application...');
      await app.close();
    });
  }

  async executeTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }
}
