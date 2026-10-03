import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { AuthPermission } from '../../../auth/infrastructure/http/decorators/index.js';
import { PermissionCode } from '../../../permissions/domain/catalog/index.js';
import type { PaginatedResponse } from '../../../../shared/application/pagination.js';
import { PermissionResponse } from '../../application/dtos/permission.response.js';
import {
  GetPermissionUseCase,
  ListPermissionsUseCase,
} from '../../application/use-cases/index.js';

import { ListPermissionsDto } from './dtos/index.js';

import { PermissionExceptionFilter } from './permission-exception.filter.js';

@Controller('permissions')
@UseFilters(PermissionExceptionFilter)
export class PermissionsController {
  constructor(
    private readonly getPermission: GetPermissionUseCase,
    private readonly listPermissions: ListPermissionsUseCase,
  ) {}

  @Get()
  @AuthPermission(PermissionCode.PERMISSION_READ)
  findAll(
    @Query() query: ListPermissionsDto,
  ): Promise<PaginatedResponse<PermissionResponse>> {
    return this.listPermissions.execute(query);
  }

  @Get(':id')
  @AuthPermission(PermissionCode.PERMISSION_READ)
  findOne(@Param('id') id: string): Promise<PermissionResponse> {
    return this.getPermission.execute(id);
  }
}
