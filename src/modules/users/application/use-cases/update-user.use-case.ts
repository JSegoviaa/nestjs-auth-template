import {
  UserEmailAlreadyExistsException,
  UserNotFoundException,
} from '../../domain/exceptions/user.exceptions.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import {
  Email,
  PersonName,
  PhoneNumber,
  UserId,
} from '../../domain/value-objects/index.js';
import { UserResponse } from '../dtos/user.response.js';
import { UserRolesService } from '../services/user-roles.service.js';

export interface UpdateUserCommand {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
  roleIds?: string[];
}

export class UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly userRoles: UserRolesService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<UserResponse> {
    const user = await this.repository.findById(UserId.fromString(command.id));

    if (!user) {
      throw new UserNotFoundException(command.id);
    }

    if (command.firstName !== undefined) {
      user.changeFirstName(PersonName.create(command.firstName));
    }

    if (command.lastName !== undefined) {
      user.changeLastName(PersonName.create(command.lastName));
    }

    if (command.email !== undefined) {
      const email = Email.create(command.email);
      const existing = await this.repository.findByEmail(email);
      if (existing && !existing.id.equals(user.id)) {
        throw new UserEmailAlreadyExistsException(email.value);
      }
      user.changeEmail(email);
    }

    if (command.phoneNumber !== undefined) {
      user.changePhoneNumber(
        command.phoneNumber === null
          ? null
          : PhoneNumber.create(command.phoneNumber),
      );
    }

    if (command.roleIds !== undefined) {
      user.assignRoles(await this.userRoles.resolveIds(command.roleIds));
    }

    await this.repository.save(user);

    return this.userRoles.toResponse(user);
  }
}
