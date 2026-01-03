import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false, // Validar que no esté expirado
    });
  }

  async validate(payload: any) {
    console.log('🔍 Validando JWT payload:', payload);

    // Simplemente validar que el payload tenga la estructura correcta
    if (!payload.sub || !payload.email) {
      console.error('❌ Payload inválido:', payload);
      throw new UnauthorizedException('Token inválido');
    }

    console.log('✅ Token válido para:', payload.email);

    // Retornar el usuario basado en el payload
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role || 'admin',
    };
  }
}
