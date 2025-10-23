import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el userId del JWT si existe, o undefined si no está autenticado
 */
export const OptionalUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.userId || undefined;
  },
);
