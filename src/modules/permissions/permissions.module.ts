import { Module, Provider } from '@nestjs/common';

import { GetPermissionUseCase } from './application/use-cases/get-permission.use-case.js';
import { ListPermissionsUseCase } from './application/use-cases/list-permissions.use-case.js';
import { SyncPermissionsUseCase } from './application/use-cases/sync-permissions.use-case.js';
import { PERMISSION_DEFINITIONS } from './domain/catalog/index.js';
import { PermissionRepository } from './domain/repositories/permission.repository.js';
import { PermissionsController } from './infrastructure/http/permissions.controller.js';
import { PrismaPermissionRepository } from './infrastructure/persistence/prisma-permission.repository.js';

// Use cases are plain classes (no framework decorators), so they are
// wired here against the repository port.
const useCaseProviders: Provider[] = [
  ...[GetPermissionUseCase, ListPermissionsUseCase].map((UseCase) => ({
    provide: UseCase,
    useFactory: (repository: PermissionRepository) => new UseCase(repository),
    inject: [PermissionRepository],
  })),
  {
    provide: SyncPermissionsUseCase,
    useFactory: (repository: PermissionRepository) =>
      new SyncPermissionsUseCase(repository, PERMISSION_DEFINITIONS),
    inject: [PermissionRepository],
  },
];

@Module({
  controllers: [PermissionsController],
  providers: [
    { provide: PermissionRepository, useClass: PrismaPermissionRepository },
    ...useCaseProviders,
  ],
  exports: [PermissionRepository, SyncPermissionsUseCase],
})
export class PermissionsModule {}
