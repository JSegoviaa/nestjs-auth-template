import { Module, Provider } from '@nestjs/common';

import { RoleRepository } from '../roles/domain/repositories/index.js';
import { RolesModule } from '../roles/roles.module.js';
import { UserRolesService } from './application/services/user-roles.service.js';
import {
  ChangeUserStatusUseCase,
  CreateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
} from './application/use-cases/index.js';
import { UserRepository } from './domain/repositories/index.js';
import { PasswordHasher } from './domain/services/index.js';
import { UsersController } from './infrastructure/http/users.controller.js';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository.js';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher.js';

// Application classes are plain (no framework decorators), so they are
// wired here against their ports.
const applicationProviders: Provider[] = [
  {
    provide: UserRolesService,
    useFactory: (roleRepository: RoleRepository) =>
      new UserRolesService(roleRepository),
    inject: [RoleRepository],
  },
  {
    provide: CreateUserUseCase,
    useFactory: (
      repository: UserRepository,
      userRoles: UserRolesService,
      passwordHasher: PasswordHasher,
    ) => new CreateUserUseCase(repository, userRoles, passwordHasher),
    inject: [UserRepository, UserRolesService, PasswordHasher],
  },
  ...[
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    ChangeUserStatusUseCase,
  ].map((UseCase) => ({
    provide: UseCase,
    useFactory: (repository: UserRepository, userRoles: UserRolesService) =>
      new UseCase(repository, userRoles),
    inject: [UserRepository, UserRolesService],
  })),
];

@Module({
  // Provides RoleRepository.
  imports: [RolesModule],
  controllers: [UsersController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    ...applicationProviders,
  ],
  exports: [UserRepository, PasswordHasher],
})
export class UsersModule {}
