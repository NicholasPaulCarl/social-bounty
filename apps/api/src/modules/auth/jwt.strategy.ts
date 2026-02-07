import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayloadFromToken {
  sub: string;
  email: string;
  role: string;
  organisationId: string | null;
  type: string;
}

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: string;
  organisationId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayloadFromToken): AuthenticatedUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      organisationId: payload.organisationId,
    };
  }
}
