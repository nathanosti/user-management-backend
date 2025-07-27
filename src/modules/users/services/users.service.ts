import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { User, IUserProps } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersRepository } from '../repositories/users.repository';

type UserCreateInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  birthDate?: Date;
};

type UserUpdateInput = Partial<UserCreateInput>;

type CurrentUser = {
  userId: string;
  role: string;
};

@Injectable()
export class UsersService {
  private readonly CACHE_PREFIX = 'user';

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cache: CacheService,
  ) { }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55')) return `+${digits}`;
    if (digits.length === 11) return `+55${digits}`;
    return `+${digits}`;
  }

  private normalizeBirthDate(birthDate: string): Date {
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) throw new Error('Invalid birthDate format');
    return date;
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const cacheKey = `${this.CACHE_PREFIX}:all:${page}:${limit}`;

    const cached = await this.cache.get<{
      users: IUserProps[];
      total: number;
      page: number;
      limit: number;
    }>(cacheKey);

    if (cached) {
      return {
        users: cached.users.map((u) => User.fromPrisma(u)),
        total: cached.total,
        page: cached.page,
        limit: cached.limit,
      };
    }

    const { users, total } = await this.usersRepository.findAll(page, limit);

    await this.cache.set(
      cacheKey,
      {
        users: users.map((u) => u.toPlain()),
        total,
        page,
        limit,
      },
      60 * 5,
    );

    return { users, total, page, limit };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string, currentUser: CurrentUser): Promise<User> {
    const isOwner = String(currentUser.userId) === String(id);
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    const cached = await this.cache.get<IUserProps>(cacheKey);
    if (cached) return User.fromPrisma(cached);

    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.cache.set(cacheKey, user.toPlain(), 60 * 5);
    return user;
  }

  async create(data: CreateUserDto, currentUser: CurrentUser): Promise<User> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create new users');
    }

    const exists = await this.usersRepository.findByEmail(data.email);
    if (exists) throw new ConflictException('E-mail already in use');

    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    const formattedData: UserCreateInput = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone ? this.normalizePhone(data.phone) : undefined,
      avatar: data.avatar,
      isActive: data.isActive,
      birthDate: data.birthDate
        ? this.normalizeBirthDate(data.birthDate)
        : undefined,
    };

    const user = await this.usersRepository.create(formattedData);
    await this.cache.del(`${this.CACHE_PREFIX}:all`);
    return user;
  }

  async update(
    id: string,
    data: UpdateUserDto,
    currentUser: CurrentUser,
  ): Promise<User> {
    if (currentUser.userId !== id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const formattedData: UserUpdateInput = {};
    if (data.phone) formattedData.phone = this.normalizePhone(data.phone);
    if (data.birthDate)
      formattedData.birthDate = this.normalizeBirthDate(data.birthDate);
    if (data.name !== undefined) formattedData.name = data.name;
    if (data.email !== undefined) formattedData.email = data.email;
    if (data.avatar !== undefined) formattedData.avatar = data.avatar;
    if (data.isActive !== undefined) formattedData.isActive = data.isActive;

    const updated = await this.usersRepository.update(id, formattedData);
    await this.cache.del(`${this.CACHE_PREFIX}:${id}`);
    await this.cache.del(`${this.CACHE_PREFIX}:all`);
    return updated;
  }

  async delete(id: string, currentUser: CurrentUser): Promise<void> {
    if (currentUser.userId !== id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own account');
    }

    await this.usersRepository.delete(id);
    await this.cache.del(`${this.CACHE_PREFIX}:${id}`);
    await this.cache.del(`${this.CACHE_PREFIX}:all`);
  }
}
