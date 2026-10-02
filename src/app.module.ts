import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma/prisma.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';

@Module({
  imports: [PrismaModule, PermissionsModule],
})
export class AppModule {}
