import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TasksService } from '../tasks.service';
import { Board, BoardDocument } from '../../schemas/board.schema';

@Injectable()
export class TaskAccessGuard implements CanActivate {
  private readonly logger = new Logger(TaskAccessGuard.name);

  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    private readonly tasksService: TasksService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const taskId = request.params?.id as string;
    const userId = request.user?.userId as string;

    this.logger.log(`TaskAccessGuard: taskId=${taskId}, userId=${userId}`);

    if (!taskId) {
      return true; // Si no hay taskId, dejar que pase (para endpoints que no lo requieren)
    }

    // Obtener la tarea para encontrar el boardId
    const task = await this.tasksService.findOne(taskId);
    if (!task) {
      throw new ForbiddenException('Tarea no encontrada');
    }

    this.logger.log(`TaskAccessGuard: task.boardId=${task.boardId.toString()}`);

    // Obtener el tablero
    const board = await this.boardModel.findById(task.boardId).exec();
    if (!board) {
      throw new ForbiddenException('Tablero no encontrado');
    }

    this.logger.log(
      `TaskAccessGuard: board.isPublic=${board.isPublic}, board.owner=${board.owner?.toString() || 'null'}`,
    );

    // Solo tableros públicos son accesibles por usuarios no autenticados
    if (board.isPublic) {
      this.logger.log('TaskAccessGuard: Acceso permitido - tablero público');
      return true;
    }

    // Si no hay usuario autenticado, no tiene acceso a tableros privados
    if (!userId) {
      this.logger.log(
        'TaskAccessGuard: Acceso denegado - no hay usuario autenticado',
      );
      throw new ForbiddenException('No tienes acceso a este tablero');
    }

    // Verificar si es el owner o está en sharedWith
    const userObjectId = new Types.ObjectId(userId);
    const hasAccess =
      board.owner?.equals(userObjectId) ||
      board.sharedWith.some((id: Types.ObjectId) => id.equals(userObjectId));

    this.logger.log(`TaskAccessGuard: hasAccess=${hasAccess}`);

    if (!hasAccess) {
      this.logger.log(
        'TaskAccessGuard: Acceso denegado - usuario no tiene permisos',
      );
      throw new ForbiddenException('No tienes acceso a este tablero');
    }

    this.logger.log(
      'TaskAccessGuard: Acceso permitido - usuario tiene permisos',
    );
    return true;
  }
}
