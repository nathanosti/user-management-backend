import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [DatabaseModule, CacheModule],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
