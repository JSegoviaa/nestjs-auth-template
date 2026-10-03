import { SessionUserUnavailableException } from '../../domain/exceptions/auth.exceptions.js';
import {
  AuthUserResponse,
  toAuthUserResponse,
} from '../dtos/auth-user.response.js';
import { AuthenticatedUserReader } from '../ports/authenticated-user.reader.js';

/** Backs GET /auth/me and the `user` returned by login. */
export class GetCurrentUserUseCase {
  constructor(private readonly reader: AuthenticatedUserReader) {}

  async execute(userId: string): Promise<AuthUserResponse> {
    const user = await this.reader.findById(userId);

    if (!user || !user.isActive) {
      throw new SessionUserUnavailableException();
    }

    return toAuthUserResponse(user);
  }
}
