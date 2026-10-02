import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import { PasswordHasher } from '../../domain/services/password-hasher.js';
import { HashedPassword } from '../../domain/value-objects/index.js';

/** PasswordHasher adapter using argon2id (the library's default). */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<HashedPassword> {
    return HashedPassword.fromHash(await argon2.hash(plainPassword));
  }

  verify(
    hashedPassword: HashedPassword,
    plainPassword: string,
  ): Promise<boolean> {
    return argon2.verify(hashedPassword.value, plainPassword);
  }
}
