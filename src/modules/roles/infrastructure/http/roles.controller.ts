import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';

import type { PaginatedResponse } from '../../../../shared/application/pagination.js';
import { RoleResponse } from '../../application/dtos/role.response.js';
import {
  CreateRoleUseCase,
  DeleteRoleUseCase,
  GetRoleUseCase,
  ListRolesUseCase,
  UpdateRoleUseCase,
} from '../../application/use-cases/index.js';
import { CreateRoleDto, ListRolesDto, UpdateRoleDto } from './dtos/index.js';
import { RoleExceptionFilter } from './role-exception.filter.js';

@Controller('roles')
@UseFilters(RoleExceptionFilter)
export class RolesController {
  constructor(
    private readonly createRole: CreateRoleUseCase,
    private readonly getRole: GetRoleUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly updateRole: UpdateRoleUseCase,
    private readonly deleteRole: DeleteRoleUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateRoleDto): Promise<RoleResponse> {
    return this.createRole.execute({
      name: dto.name,
      description: dto.description,
      permissionIds: dto.permissionIds,
    });
  }

  @Get()
  findAll(
    @Query() query: ListRolesDto,
  ): Promise<PaginatedResponse<RoleResponse>> {
    return this.listRoles.execute(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<RoleResponse> {
    return this.getRole.execute(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponse> {
    return this.updateRole.execute({
      id,
      name: dto.name,
      description: dto.description,
      permissionIds: dto.permissionIds,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteRole.execute(id);
  }
}
