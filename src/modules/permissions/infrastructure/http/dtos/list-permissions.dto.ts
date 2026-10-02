import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../../../shared/infrastructure/http/pagination-query.dto.js';
import {
  PERMISSION_ORDER_BY_FIELDS,
  type PermissionOrderBy,
} from '../../../domain/repositories/index.js';

export class ListPermissionsDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(PERMISSION_ORDER_BY_FIELDS)
  orderBy?: PermissionOrderBy;
}
