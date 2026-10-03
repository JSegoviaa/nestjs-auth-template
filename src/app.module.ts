import { Module } from '@nestjs/common';

import { AuthModule } from './modules/auth/auth.module.js';
import { BootstrapModule } from './bootstrap/bootstrap.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { PrismaModule } from './database/prisma/prisma.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    AuthModule,
    BootstrapModule,
    PermissionsModule,
    PrismaModule,
    RolesModule,
    UsersModule,
  ],
})
export class AppModule {}
