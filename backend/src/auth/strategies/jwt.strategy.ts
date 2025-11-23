import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  validate(payload: { sub: string; walletAddress: string }) {
    try {
      this.logger.log(
        `JwtStrategy: Validando payload: sub=${payload.sub}, walletAddress=${payload.walletAddress}`,
      );
      const result = {
        userId: payload.sub,
        walletAddress: payload.walletAddress,
      };
      this.logger.log(
        `JwtStrategy: Usuario validado: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`JwtStrategy: Error al validar token: ${error}`);
      throw new UnauthorizedException(`Error al validar el token: ${error}`);
    }
  }
}
