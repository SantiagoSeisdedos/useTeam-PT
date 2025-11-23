import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  // Override handleRequest para no lanzar error si no hay token
  handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    this.logger.log(
      `OptionalJwtAuthGuard: err=${err}, user=${user ? user.userId : 'null'}, info=${info?.message || 'none'}`,
    );

    // Si hay error o no hay usuario, simplemente retorna null
    // No lanza excepción

    return user || null;
  }

  // Override canActivate para manejar autenticación opcional
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (err) {
      this.logger.error(
        `OptionalJwtAuthGuard: Error en autenticación: ${err.message}`,
      );
      return true;
    }
  }
}
