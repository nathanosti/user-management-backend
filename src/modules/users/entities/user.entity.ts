import { Exclude } from 'class-transformer';
import { Role } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export interface IUserProps {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  birthDate?: Date | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  password?: string;
  role: Role;
}

export class User {
  constructor(private readonly props: IUserProps) {
    if (!props.email || !props.name || !props.role) {
      throw new BadRequestException('Missing required user fields.');
    }
  }

  static create(props: IUserProps): User {
    return new User(props);
  }

  static fromPrisma(props: IUserProps): User {
    return new User(props);
  }

  get id() {
    return this.props.id;
  }

  get email() {
    return this.props.email;
  }

  get name() {
    return this.props.name;
  }

  get phone() {
    return this.props.phone ?? undefined;
  }

  get birthDate() {
    return this.props.birthDate ?? undefined;
  }

  get avatar() {
    return this.props.avatar ?? undefined;
  }

  get isActive() {
    return this.props.isActive;
  }

  get role() {
    return this.props.role;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  @Exclude()
  get password(): string | undefined {
    return this.props.password;
  }

  toPlain(): Omit<IUserProps, 'password'> {
    const { password, ...rest } = this.props;
    return rest;
  }

  get data(): Omit<IUserProps, 'password'> {
    const { password, ...rest } = this.props;
    return rest;
  }
}
