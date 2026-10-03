import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';
import { UserId } from '../../../users/domain/value-objects/index.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import { RefreshTokenId } from '../../domain/value-objects/index.js';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({ data: token.toPrimitives() });
  }

  async findById(id: RefreshTokenId): Promise<RefreshToken | null> {
    const raw = await this.prisma.refreshToken.findUnique({
      where: { id: id.value },
    });
    return raw ? RefreshToken.fromPrimitives(raw) : null;
  }

  async revoke(id: RefreshTokenId): Promise<boolean> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: id.value, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count === 1;
  }

  async revokeAllForUser(userId: UserId): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId: userId.value, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
