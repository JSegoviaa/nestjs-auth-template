import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';

import type { PaginatedResponse } from '../../../../shared/application/pagination.js';
import { UserResponse } from '../../application/dtos/user.response.js';
import {
  ChangeUserStatusUseCase,
  CreateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
} from '../../application/use-cases/index.js';
import {
  ChangeUserStatusDto,
  CreateUserDto,
  ListUsersDto,
  UpdateUserDto,
} from './dtos/index.js';
import { UserExceptionFilter } from './user-exception.filter.js';

@Controller('users')
@UseFilters(UserExceptionFilter)
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly changeUserStatus: ChangeUserStatusUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return this.createUser.execute({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      password: dto.password,
      roleIds: dto.roleIds,
    });
  }

  @Get()
  findAll(
    @Query() query: ListUsersDto,
  ): Promise<PaginatedResponse<UserResponse>> {
    return this.listUsers.execute(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.getUser.execute(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.updateUser.execute({
      id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      roleIds: dto.roleIds,
    });
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeUserStatusDto,
  ): Promise<UserResponse> {
    return this.changeUserStatus.execute({ id, status: dto.status });
  }
}
