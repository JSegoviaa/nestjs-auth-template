import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../../../shared/infrastructure/http/pagination-query.dto.js';
import {
  USER_ORDER_BY_FIELDS,
  type UserOrderBy,
} from '../../../domain/repositories/index.js';

export class ListUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(USER_ORDER_BY_FIELDS)
  orderBy?: UserOrderBy;
}
