import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/database/prisma.service';
import { CacheService } from 'src/modules/cache/cache.service';
import { User, IUserProps } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

type PrismaUserCreateInput = {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  birthDate?: Date;
};

type PrismaUserUpdateInput = Partial<PrismaUserCreateInput>;

@Injectable()
export class UsersService {
  private readonly CACHE_PREFIX = 'user';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) { }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.startsWith('55')) {
      return `+${digits}`;
    }

    if (digits.length === 11) {
      return `+55${digits}`;
    }

    return `+${digits}`;
  }

  private normalizeBirthDate(birthDate: string): Date {
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid birthDate format');
    }
    return date;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map((u) => User.create(u));
  }

  async findById(id: string): Promise<User> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;

    try {
      const cached = await this.cache.get<IUserProps>(cacheKey);
      if (cached) {
        return User.create(cached);
      }

      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.cache.set(cacheKey, user, 60 * 5);
      return User.create(user);
    } catch (error) {
      throw error;
    }
  }

  async create(data: CreateUserDto): Promise<User> {
    try {
      const formattedData: PrismaUserCreateInput = {
        name: data.name,
        email: data.email,
        phone: data.phone ? this.normalizePhone(data.phone) : undefined,
        avatar: data.avatar,
        isActive: data.isActive,
        birthDate: data.birthDate
          ? this.normalizeBirthDate(data.birthDate)
          : undefined,
      };

      const created = await this.prisma.user.create({ data: formattedData });
      return User.create(created);
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const formattedData: PrismaUserUpdateInput = {};

      if (data.phone) {
        formattedData.phone = this.normalizePhone(data.phone);
      }

      if (data.birthDate) {
        formattedData.birthDate = this.normalizeBirthDate(data.birthDate);
      }

      if (data.name !== undefined) formattedData.name = data.name;
      if (data.email !== undefined) formattedData.email = data.email;
      if (data.avatar !== undefined) formattedData.avatar = data.avatar;
      if (data.isActive !== undefined) formattedData.isActive = data.isActive;

      const updated = await this.prisma.user.update({
        where: { id },
        data: formattedData,
      });

      await this.cache.del(`${this.CACHE_PREFIX}:${id}`);
      return User.create(updated);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
      await this.cache.del(`${this.CACHE_PREFIX}:${id}`);
    } catch (error) {
      throw error;
    }
  }
}
