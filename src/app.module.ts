import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma/prisma.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { RolesModule } from './modules/roles/roles.module.js';

@Module({
  imports: [PrismaModule, PermissionsModule, RolesModule],
})
export class AppModule {}
