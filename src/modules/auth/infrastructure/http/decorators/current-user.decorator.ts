import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedUser } from '../../../application/dtos/authenticated-user.js';

/**
 * Injects the authenticated user into a handler parameter. Use it on
 * endpoints protected with @AuthPermission().
 *
 * @example
 * findMine(@CurrentUser() user: AuthenticatedUser) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user,
);
