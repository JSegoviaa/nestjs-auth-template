import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { MAX_LIMIT } from '../../application/pagination.js';
import {
  SORT_DIRECTIONS,
  type SortDirection,
} from '../../domain/pagination.js';

/**
 * Base query DTO for list endpoints. Each module extends it and adds its own
 * `orderBy` validated against the entity's allowed fields.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number;

  // Accepts "ASC"/"DESC" as well, like SQL.
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(SORT_DIRECTIONS)
  sort?: SortDirection;
}
