import { UserNotFoundException } from '../../domain/exceptions/user.exceptions.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserId } from '../../domain/value-objects/index.js';
import { UserResponse } from '../dtos/user.response.js';
import { UserRolesService } from '../services/user-roles.service.js';

export class GetUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly userRoles: UserRolesService,
  ) {}

  async execute(id: string): Promise<UserResponse> {
    const user = await this.repository.findById(UserId.fromString(id));

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return this.userRoles.toResponse(user);
  }
}
