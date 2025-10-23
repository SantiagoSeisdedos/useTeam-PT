import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { BoardsService } from '../boards.service';

@Injectable()
export class BoardAccessGuard implements CanActivate {
  constructor(private readonly boardsService: BoardsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const boardId = request.params.id;
    const userId = request.user?.userId;

    if (!boardId) {
      return true; // Si no hay boardId, dejar que pase (para endpoints que no lo requieren)
    }

    const hasAccess = await this.boardsService.hasAccess(boardId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('No tienes acceso a este tablero');
    }

    return true;
  }
}
