import { Module, Provider } from '@nestjs/common';

import { PermissionCode } from '../permissions/domain/catalog/index.js';
import { PermissionRepository } from '../permissions/domain/repositories/index.js';
import { PermissionsModule } from '../permissions/permissions.module.js';
import { RolePermissionsService } from './application/services/role-permissions.service.js';
import {
  CreateRoleUseCase,
  DeleteRoleUseCase,
  EnsureRootRoleUseCase,
  GetRoleUseCase,
  ListRolesUseCase,
  UpdateRoleUseCase,
} from './application/use-cases/index.js';
import { RoleRepository } from './domain/repositories/index.js';
import { RolesController } from './infrastructure/http/roles.controller.js';
import { PrismaRoleRepository } from './infrastructure/persistence/prisma-role.repository.js';

// Application classes are plain (no framework decorators), so they are
// wired here against their ports.
const applicationProviders: Provider[] = [
  {
    provide: RolePermissionsService,
    useFactory: (permissionRepository: PermissionRepository) =>
      new RolePermissionsService(permissionRepository),
    inject: [PermissionRepository],
  },
  ...[
    CreateRoleUseCase,
    GetRoleUseCase,
    ListRolesUseCase,
    UpdateRoleUseCase,
  ].map((UseCase) => ({
    provide: UseCase,
    useFactory: (
      repository: RoleRepository,
      rolePermissions: RolePermissionsService,
    ) => new UseCase(repository, rolePermissions),
    inject: [RoleRepository, RolePermissionsService],
  })),
  {
    provide: DeleteRoleUseCase,
    useFactory: (repository: RoleRepository) =>
      new DeleteRoleUseCase(repository),
    inject: [RoleRepository],
  },
  {
    provide: EnsureRootRoleUseCase,
    useFactory: (
      repository: RoleRepository,
      permissionRepository: PermissionRepository,
    ) =>
      new EnsureRootRoleUseCase(
        repository,
        permissionRepository,
        Object.values(PermissionCode),
      ),
    inject: [RoleRepository, PermissionRepository],
  },
];

@Module({
  // Provides PermissionRepository.
  imports: [PermissionsModule],
  controllers: [RolesController],
  providers: [
    { provide: RoleRepository, useClass: PrismaRoleRepository },
    ...applicationProviders,
  ],
  exports: [RoleRepository, EnsureRootRoleUseCase],
})
export class RolesModule {}
