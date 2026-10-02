import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
