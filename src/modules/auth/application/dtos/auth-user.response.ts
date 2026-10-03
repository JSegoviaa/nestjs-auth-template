import type { AuthenticatedUserView } from '../ports/authenticated-user.reader.js';
import type { AuthTokensResponse } from './auth-tokens.response.js';

/**
 * The logged-in user as the frontend sees it. Same shape in
 * POST /auth/login (`user`) and GET /auth/me.
 */
export interface AuthUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roles: { id: string; name: string }[];
  /** Effective permissions, for showing/hiding UI. The API enforces them. */
  permissions: string[];
}

export interface LoginResponse extends AuthTokensResponse {
  user: AuthUserResponse;
}

export const toAuthUserResponse = ({
  id,
  firstName,
  lastName,
  email,
  phoneNumber,
  roles,
  permissions,
}: AuthenticatedUserView): AuthUserResponse => ({
  id,
  firstName,
  lastName,
  email,
  phoneNumber,
  roles,
  permissions,
});
