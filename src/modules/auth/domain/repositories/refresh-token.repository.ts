import { UserId } from '../../../users/domain/value-objects/index.js';
import { RefreshToken } from '../entities/refresh-token.entity.js';
import { RefreshTokenId } from '../value-objects/index.js';

export abstract class RefreshTokenRepository {
  abstract create(token: RefreshToken): Promise<void>;
  abstract findById(id: RefreshTokenId): Promise<RefreshToken | null>;
  abstract revoke(id: RefreshTokenId): Promise<boolean>;
  abstract revokeAllForUser(userId: UserId): Promise<void>;
}
