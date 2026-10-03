import { Module } from '@nestjs/common';

import { PermissionsModule } from '../modules/permissions/permissions.module.js';
import { RolesModule } from '../modules/roles/roles.module.js';
import { UsersModule } from '../modules/users/users.module.js';
import { SeedInitializer } from './seed.initializer.js';

/** Startup data (permissions, ROOT role, root user). No HTTP endpoints. */
@Module({
  imports: [PermissionsModule, RolesModule, UsersModule],
  providers: [SeedInitializer],
})
export class BootstrapModule {}
