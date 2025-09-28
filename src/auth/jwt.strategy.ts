import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  logger = new Logger(JwtStrategy.name);
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  validate(payload: { sub: string; type: string; email: string }) {
    // 只验证 access_token
    if (payload.type !== 'access') {
      return null;
    }

    return {
      userId: payload.sub,
      fakeer: 1,
    };
  }
}
