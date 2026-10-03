import { InvalidEmailException } from '../../../users/domain/exceptions/index.js';
import { UserRepository } from '../../../users/domain/repositories/index.js';
import { PasswordHasher } from '../../../users/domain/services/index.js';
import { Email } from '../../../users/domain/value-objects/index.js';
import {
  InactiveUserException,
  InvalidCredentialsException,
} from '../../domain/exceptions/auth.exceptions.js';
import { LoginResponse } from '../dtos/auth-user.response.js';
import { AuthTokensService } from '../services/auth-tokens.service.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';

export interface LoginCommand {
  email: string;
  password: string;
}

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly authTokens: AuthTokensService,
    private readonly getCurrentUser: GetCurrentUserUseCase,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponse> {
    const user = await this.users.findByEmail(this.parseEmail(command.email));

    if (
      !user ||
      !(await this.passwordHasher.verify(user.password, command.password))
    ) {
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) {
      throw new InactiveUserException();
    }

    const [tokens, profile] = await Promise.all([
      this.authTokens.issue(user.id),
      this.getCurrentUser.execute(user.id.value),
    ]);

    return { ...tokens, user: profile };
  }

  private parseEmail(raw: string): Email {
    try {
      return Email.create(raw);
    } catch (error) {
      if (error instanceof InvalidEmailException) {
        throw new InvalidCredentialsException();
      }
      throw error;
    }
  }
}
