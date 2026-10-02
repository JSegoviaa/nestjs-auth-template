import type { HashedPassword } from '../value-objects/hashed-password.vo.js';

/**
 * Output port for password hashing. Declared as an abstract class so it can
 * be used as a NestJS injection token; implemented in infrastructure.
 */
export abstract class PasswordHasher {
  abstract hash(plainPassword: string): Promise<HashedPassword>;
  abstract verify(
    hashedPassword: HashedPassword,
    plainPassword: string,
  ): Promise<boolean>;
}
