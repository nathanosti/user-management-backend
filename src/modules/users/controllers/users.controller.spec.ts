import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CurrentUser } from '../types/current-user.type';
import { User, IUserProps } from '../entities/user.entity';
import { Role } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const makeMockUser = (overrides: Partial<IUserProps> = {}): User => {
    return User.create({
      id: overrides.id ?? 'user-id',
      email: overrides.email ?? 'mock@example.com',
      name: overrides.name ?? 'Mock User',
      phone: overrides.phone ?? '11999999999',
      birthDate: overrides.birthDate ?? new Date('1990-01-01'),
      avatar: overrides.avatar ?? null,
      isActive: overrides.isActive ?? true,
      createdAt: overrides.createdAt ?? new Date(),
      updatedAt: overrides.updatedAt ?? new Date(),
      password: overrides.password ?? 'hashed-password',
      role: overrides.role ?? Role.MEMBER,
    });
  };

  const mockUsersService: Partial<jest.Mocked<UsersService>> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [
        makeMockUser({ id: '1', name: 'Alice' }),
        makeMockUser({ id: '2', name: 'Bob' }),
      ];

      usersService.findAll.mockResolvedValue({
        users,
        total: 2,
        page: 1,
        limit: 10,
      });

      const result = await controller.findAll(1, 10);

      expect(usersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const user = makeMockUser({ id: '1', name: 'Alice' });
      usersService.findById.mockResolvedValue(user);

      const result = await controller.findById('1');

      expect(usersService.findById).toHaveBeenCalledWith('1');
      expect(result).toMatchObject({
        id: '1',
        name: 'Alice',
        email: user.email,
      });
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = {
        email: 'alice@example.com',
        name: 'Alice',
        password: '123456',
        role: Role.MEMBER,
      };
      const currentUser: CurrentUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };
      const createdUser = makeMockUser({
        id: '1',
        email: dto.email,
        name: dto.name,
      });

      usersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(dto, currentUser);

      expect(usersService.create).toHaveBeenCalledWith(dto, currentUser);
      expect(result).toMatchObject({
        id: '1',
        email: dto.email,
        name: dto.name,
      });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const dto: UpdateUserDto = { name: 'Updated Name' };
      const currentUser: CurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: Role.MEMBER,
      };
      const updatedUser = makeMockUser({
        id: 'user-1',
        name: dto.name,
        email: currentUser.email,
      });

      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-1', dto, currentUser);

      expect(usersService.update).toHaveBeenCalledWith(
        'user-1',
        dto,
        currentUser,
      );
      expect(result).toMatchObject({
        id: 'user-1',
        name: dto.name,
      });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const currentUser: CurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: Role.MEMBER,
      };

      await controller.delete('user-1', currentUser);

      expect(usersService.delete).toHaveBeenCalledWith('user-1', currentUser);
    });
  });
});
