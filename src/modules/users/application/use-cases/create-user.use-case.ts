import { User } from '../../domain/entities/user.entity.js';
import { UserEmailAlreadyExistsException } from '../../domain/exceptions/user.exceptions.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { PasswordHasher } from '../../domain/services/password-hasher.js';
import {
  Email,
  PersonName,
  PhoneNumber,
} from '../../domain/value-objects/index.js';
import { UserResponse } from '../dtos/user.response.js';
import { UserRolesService } from '../services/user-roles.service.js';

export interface CreateUserCommand {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  password: string;
  roleIds: string[];
}

export class CreateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly userRoles: UserRolesService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResponse> {
    const email = Email.create(command.email);

    if (await this.repository.findByEmail(email)) {
      throw new UserEmailAlreadyExistsException(email.value);
    }

    const user = User.create({
      firstName: PersonName.create(command.firstName),
      lastName: PersonName.create(command.lastName),
      email,
      phoneNumber: command.phoneNumber
        ? PhoneNumber.create(command.phoneNumber)
        : null,
      roleIds: await this.userRoles.resolveIds(command.roleIds),
      password: await this.passwordHasher.hash(command.password),
    });

    await this.repository.save(user);

    return this.userRoles.toResponse(user);
  }
}
