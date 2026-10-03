import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { ENVS } from '../config/envs.js';
import { SyncPermissionsUseCase } from '../modules/permissions/application/use-cases/index.js';
import { EnsureRootRoleUseCase } from '../modules/roles/application/use-cases/index.js';
import { EnsureRootUserUseCase } from '../modules/users/application/use-cases/index.js';

/**
 * Runs on every startup, in order (each step depends on the previous one):
 * 1. Syncs the permission catalog (PermissionCode) into the database.
 * 2. Ensures the ROOT role exists with every permission.
 * 3. Ensures the root user exists (only if ROOT_USER_* env vars are set).
 * Every step is idempotent.
 */
@Injectable()
export class SeedInitializer implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedInitializer.name);

  constructor(
    private readonly syncPermissions: SyncPermissionsUseCase,
    private readonly ensureRootRole: EnsureRootRoleUseCase,
    private readonly ensureRootUser: EnsureRootUserUseCase,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const permissions = await this.syncPermissions.execute();
    if (permissions.created.length) {
      this.logger.log(`Created permissions: ${permissions.created.join(', ')}`);
    }
    if (permissions.updated.length) {
      this.logger.log(`Updated permissions: ${permissions.updated.join(', ')}`);
    }

    const rootRole = await this.ensureRootRole.execute();
    if (rootRole.created) {
      this.logger.log('Created ROOT role with every permission');
    } else if (rootRole.permissionsUpdated) {
      this.logger.log('Updated ROOT role: it now has every permission');
    }

    if (!ENVS.ROOT_USER) {
      this.logger.warn(
        'ROOT_USER_EMAIL/ROOT_USER_PASSWORD not set: skipping root user',
      );
      return;
    }
    const rootUser = await this.ensureRootUser.execute({
      email: ENVS.ROOT_USER.EMAIL,
      password: ENVS.ROOT_USER.PASSWORD,
      firstName: ENVS.ROOT_USER.FIRST_NAME,
      lastName: ENVS.ROOT_USER.LAST_NAME,
      rootRoleId: rootRole.roleId,
    });
    if (rootUser === 'created') {
      this.logger.log(`Created root user ${ENVS.ROOT_USER.EMAIL}`);
    } else if (rootUser === 'role-assigned') {
      this.logger.log(`Assigned ROOT role to ${ENVS.ROOT_USER.EMAIL}`);
    }
  }
}
