import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  logger = new Logger(AdminJwtStrategy.name);
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  validate(payload: { sub: string; type: string; role?: string }) {
    // 只验证 access_token 且必须是 admin role
    if (payload.type !== 'access' || payload.role !== 'admin') {
      return null;
    }

    return {
      adminId: payload.sub,
    };
  }
}
