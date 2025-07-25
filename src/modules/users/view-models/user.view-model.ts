import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export interface IUserViewModel {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthDate?: Date;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserViewModel {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  birthDate?: Date;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  static toHTTP(user: User): IUserViewModel {
    const data = user.data;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone ?? undefined,
      birthDate: data.birthDate ?? undefined,
      avatar: data.avatar ?? undefined,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
