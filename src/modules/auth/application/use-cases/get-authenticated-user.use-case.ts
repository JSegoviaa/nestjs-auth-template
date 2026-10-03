import { AuthenticatedUser } from '../dtos/authenticated-user.js';
import { AuthenticatedUserReader } from '../ports/authenticated-user.reader.js';

export class GetAuthenticatedUserUseCase {
  constructor(private readonly reader: AuthenticatedUserReader) {}

  async execute(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.reader.findById(userId);

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      permissions: user.permissions,
    };
  }
}
