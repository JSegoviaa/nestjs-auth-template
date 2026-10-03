import { UserId } from '../../../users/domain/value-objects/index.js';
import { RefreshTokenId } from '../value-objects/index.js';

export interface RefreshTokenPrimitives {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

interface RefreshTokenProps {
  id: RefreshTokenId;
  userId: UserId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export class RefreshToken {
  private constructor(private readonly props: RefreshTokenProps) {}

  static issue(params: {
    id: RefreshTokenId;
    userId: UserId;
    tokenHash: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken({
      ...params,
      revokedAt: null,
      createdAt: new Date(),
    });
  }

  static fromPrimitives(primitives: RefreshTokenPrimitives): RefreshToken {
    return new RefreshToken({
      ...primitives,
      id: RefreshTokenId.fromString(primitives.id),
      userId: UserId.fromString(primitives.userId),
    });
  }

  get id(): RefreshTokenId {
    return this.props.id;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isExpired(now = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  matches(tokenHash: string): boolean {
    return this.props.tokenHash === tokenHash;
  }

  toPrimitives(): RefreshTokenPrimitives {
    return {
      id: this.props.id.value,
      userId: this.props.userId.value,
      tokenHash: this.props.tokenHash,
      expiresAt: this.props.expiresAt,
      revokedAt: this.props.revokedAt,
      createdAt: this.props.createdAt,
    };
  }
}
