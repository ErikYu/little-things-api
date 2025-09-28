import { Injectable } from '@nestjs/common';
import * as AppleSignIn from 'apple-signin-auth';

@Injectable()
export class AppleAuthService {
  async verifyToken(identityToken: string) {
    try {
      // 验证 Apple Identity Token
      const appleUser = await AppleSignIn.verifyIdToken(identityToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      });

      return appleUser;
    } catch (error) {
      throw new Error(
        `[AppleAuthService] Apple token verification failed: ${(error as Error).message}`,
      );
    }
  }
}
