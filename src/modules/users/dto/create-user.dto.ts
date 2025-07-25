import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  Matches,
  MinLength,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^(\+55\s?)?(\d{2})\s?\d{4,5}-?\d{4}$/, {
    message: 'phone must be a valid Brazilian phone number',
  })
  phone?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    enum: Role,
    default: Role.MEMBER,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'role must be ADMIN or MEMBER' })
  role?: Role;

  @ApiProperty({ required: false, minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
