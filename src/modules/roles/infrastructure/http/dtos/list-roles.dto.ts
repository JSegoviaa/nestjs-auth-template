import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../../../shared/infrastructure/http/pagination-query.dto.js';
import {
  ROLE_ORDER_BY_FIELDS,
  type RoleOrderBy,
} from '../../../domain/repositories/index.js';

export class ListRolesDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(ROLE_ORDER_BY_FIELDS)
  orderBy?: RoleOrderBy;
}
