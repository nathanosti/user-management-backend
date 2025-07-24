import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserViewModel } from '../view-models/user.view-model';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso.',
  })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(UserViewModel.toHTTP);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return UserViewModel.toHTTP(user);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  async create(@Body() data: CreateUserDto) {
    const user = await this.usersService.create(data);
    return UserViewModel.toHTTP(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário existente' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    const user = await this.usersService.update(id, data);
    return UserViewModel.toHTTP(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover usuário' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 204, description: 'Usuário removido com sucesso.' })
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
  }
}
