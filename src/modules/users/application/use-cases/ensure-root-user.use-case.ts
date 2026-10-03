import { RoleId } from '../../../roles/domain/value-objects/index.js';
import { User } from '../../domain/entities/user.entity.js';
import { UserEmailAlreadyExistsException } from '../../domain/exceptions/user.exceptions.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { PasswordHasher } from '../../domain/services/password-hasher.js';
import { Email, PersonName } from '../../domain/value-objects/index.js';

export interface EnsureRootUserCommand {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  rootRoleId: RoleId;
}

export type EnsureRootUserResult = 'created' | 'role-assigned' | 'unchanged';

/**
 * Makes sure the initial root user exists and has the ROOT role, so a fresh
 * environment always has someone able to log in. Idempotent: an existing
 * user is never modified except to (re)gain the ROOT role, and its password
 * is never overwritten.
 */
export class EnsureRootUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: EnsureRootUserCommand): Promise<EnsureRootUserResult> {
    const email = Email.create(command.email);
    const existing = await this.users.findByEmail(email);

    if (existing) {
      if (existing.roleIds.some((id) => id.equals(command.rootRoleId))) {
        return 'unchanged';
      }
      existing.assignRoles([...existing.roleIds, command.rootRoleId]);
      await this.users.save(existing);
      return 'role-assigned';
    }

    const user = User.create({
      firstName: PersonName.create(command.firstName),
      lastName: PersonName.create(command.lastName),
      email,
      password: await this.passwordHasher.hash(command.password),
      roleIds: [command.rootRoleId],
    });
    try {
      await this.users.save(user);
    } catch (error) {
      // Another instance created it concurrently.
      if (error instanceof UserEmailAlreadyExistsException) return 'unchanged';
      throw error;
    }
    return 'created';
  }
}
