import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { SyncPermissionsUseCase } from '../../application/use-cases/sync-permissions.use-case.js';

/** Syncs the permission catalog into the database on every startup. */
@Injectable()
export class PermissionsSyncInitializer implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionsSyncInitializer.name);

  constructor(private readonly syncPermissions: SyncPermissionsUseCase) {}

  async onApplicationBootstrap(): Promise<void> {
    const { created, updated } = await this.syncPermissions.execute();

    if (created.length) {
      this.logger.log(`Created permissions: ${created.join(', ')}`);
    }
    if (updated.length) {
      this.logger.log(`Updated permissions: ${updated.join(', ')}`);
    }
  }
}
