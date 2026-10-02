import { UserNotFoundException } from '../../domain/exceptions/user.exceptions.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserId, UserStatus } from '../../domain/value-objects/index.js';
import { UserResponse } from '../dtos/user.response.js';
import { UserRolesService } from '../services/user-roles.service.js';

export interface ChangeUserStatusCommand {
  id: string;
  status: UserStatus;
}

/** INACTIVE sets `deactivatedAt` to now; ACTIVE sets it back to null. */
export class ChangeUserStatusUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly userRoles: UserRolesService,
  ) {}

  async execute(command: ChangeUserStatusCommand): Promise<UserResponse> {
    const user = await this.repository.findById(UserId.fromString(command.id));

    if (!user) {
      throw new UserNotFoundException(command.id);
    }

    user.changeStatus(command.status);

    await this.repository.save(user);

    return this.userRoles.toResponse(user);
  }
}
