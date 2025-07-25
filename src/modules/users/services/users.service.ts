import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CacheService } from 'src/modules/cache/cache.service';
import { User, IUserProps } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersRepository } from '../repositories/users.repository';

type UserCreateInput = {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  birthDate?: Date;
};

type UserUpdateInput = Partial<UserCreateInput>;

@Injectable()
export class UsersService {
  private readonly CACHE_PREFIX = 'user';

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cache: CacheService,
  ) {}

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

  async findAll(): Promise<User[]> {
    const cacheKey = `${this.CACHE_PREFIX}:all`;

    const cached = await this.cache.get<IUserProps[]>(cacheKey);

    if (cached) return cached.map((u) => User.fromPrisma(u));

    const users = await this.usersRepository.findAll();
    await this.cache.set(
      cacheKey,
      users.map((u) => u.toPlain()),
      60 * 5,
    );

    return users;
  }

  async findById(id: string): Promise<User> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;

    const cached = await this.cache.get<IUserProps>(cacheKey);
    if (cached) return User.fromPrisma(cached);

    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.cache.set(cacheKey, user.toPlain(), 60 * 5);
    return user;
  }

  async create(data: CreateUserDto): Promise<User> {
    const exists = await this.usersRepository.findByEmail(data.email);
    if (exists) throw new ConflictException('E-mail already in use');

    const formattedData: UserCreateInput = {
      name: data.name,
      email: data.email,
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

  async update(id: string, data: UpdateUserDto): Promise<User> {
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

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
    await this.cache.del(`${this.CACHE_PREFIX}:${id}`);
    await this.cache.del(`${this.CACHE_PREFIX}:all`);
  }
}
