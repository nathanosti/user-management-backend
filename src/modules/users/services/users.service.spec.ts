import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from '../repositories/users.repository';
import { CacheService } from '../../cache/cache.service';
import { User, IUserProps } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let cache: jest.Mocked<CacheService>;

  const mockUserProps = (overrides: Partial<IUserProps> = {}): IUserProps => ({
    id: overrides.id ?? 'user-id',
    email: overrides.email ?? 'test@example.com',
    name: overrides.name ?? 'Test User',
    phone: overrides.phone ?? '11999999999',
    birthDate: overrides.birthDate ?? new Date('1990-01-01'),
    avatar: overrides.avatar ?? null,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    password: overrides.password ?? '123456',
    role: overrides.role ?? Role.MEMBER,
  });

  const makeUser = (props: Partial<IUserProps> = {}) =>
    User.create(mockUserProps(props));

  beforeEach(async () => {
    usersRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return users from repository and cache result', async () => {
      cache.get.mockResolvedValue(null);
      const users = [makeUser(), makeUser({ id: '2' })];
      usersRepository.findAll.mockResolvedValue({ users, total: 2 });

      const result = await service.findAll(1, 10);

      expect(usersRepository.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.users).toHaveLength(2);
      expect(cache.set).toHaveBeenCalled();
    });

    it('should return cached result', async () => {
      const cachedUsers = [mockUserProps(), mockUserProps({ id: '2' })];
      cache.get.mockResolvedValue({
        users: cachedUsers,
        total: 2,
        page: 1,
        limit: 10,
      });

      const result = await service.findAll(1, 10);

      expect(usersRepository.findAll).not.toHaveBeenCalled();
      expect(result.users).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return cached user', async () => {
      const cached = mockUserProps();
      cache.get.mockResolvedValue(cached);

      const result = await service.findById('user-id');

      expect(result.id).toBe(cached.id);
    });

    it('should return user from repo and cache it', async () => {
      cache.get.mockResolvedValue(null);
      const user = makeUser();
      usersRepository.findById.mockResolvedValue(user);

      const result = await service.findById('user-id');

      expect(usersRepository.findById).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
      expect(result.id).toBe(user.id);
    });

    it('should throw if not found', async () => {
      cache.get.mockResolvedValue(null);
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.findById('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create user if admin and email not in use', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      const mockCreated = makeUser();
      usersRepository.create.mockResolvedValue(mockCreated);

      const dto: CreateUserDto = {
        email: mockCreated.email,
        name: mockCreated.name,
        password: 'abc123',
        role: Role.MEMBER,
      };

      const currentUser = { id: 'admin-id', role: 'ADMIN' };
      const result = await service.create(dto, currentUser);

      expect(usersRepository.create).toHaveBeenCalled();
      expect(result.id).toBe(mockCreated.id);
    });

    it('should throw if not admin', async () => {
      const dto: CreateUserDto = {
        email: 'x@example.com',
        name: 'X',
        password: 'abc123',
        role: Role.MEMBER,
      };

      const currentUser = { id: 'member-id', role: 'MEMBER' };
      await expect(service.create(dto, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw if email already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(makeUser());

      const dto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test',
        password: '123456',
        role: Role.MEMBER,
      };

      const currentUser = { id: 'admin', role: 'ADMIN' };
      await expect(service.create(dto, currentUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update user if same user or admin', async () => {
      const user = makeUser();
      usersRepository.findById.mockResolvedValue(user);

      const dto: UpdateUserDto = { name: 'New Name' };
      const currentUser = { id: user.id, role: 'MEMBER' };

      const updatedUser = makeUser({ ...user.data, name: 'New Name' });
      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(user.id, dto, currentUser);

      expect(result.name).toBe('New Name');
    });

    it('should throw if unauthorized', async () => {
      const user = makeUser();
      usersRepository.findById.mockResolvedValue(user);

      const dto: UpdateUserDto = { name: 'Hack' };
      const currentUser = { id: 'other-id', role: 'MEMBER' };

      await expect(service.update(user.id, dto, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw if user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      const dto: UpdateUserDto = { name: 'Test' };
      const currentUser = { id: 'user-id', role: 'ADMIN' };

      await expect(service.update('user-id', dto, currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete if admin or owner', async () => {
      const currentUser = { id: 'user-id', role: 'ADMIN' };

      await service.delete('user-id', currentUser);
      expect(usersRepository.delete).toHaveBeenCalledWith('user-id');
    });

    it('should throw if unauthorized', async () => {
      const currentUser = { id: 'user-id', role: 'MEMBER' };
      await expect(service.delete('other-id', currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
