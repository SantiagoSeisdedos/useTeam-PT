import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from '../schemas/board.schema';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { KanbanGateway } from '../gateway/kanban.gateway';

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private kanbanGateway: KanbanGateway,
  ) {}

  async create(
    createBoardDto: CreateBoardDto,
    userId?: string,
  ): Promise<Board> {
    const boardData: Partial<Board> & CreateBoardDto = { ...createBoardDto };

    // Si hay usuario autenticado, asignarlo como owner
    if (userId) {
      boardData.owner = new Types.ObjectId(userId);
    }

    const createdBoard = new this.boardModel(boardData);
    return createdBoard.save();
  }

  async findAll(userId?: string): Promise<Board[]> {
    // Si no hay usuario, retornar SOLO tableros públicos
    if (!userId) {
      return this.boardModel
        .find({
          isPublic: true,
        })
        .populate('owner', 'walletAddress username')
        .exec();
    }

    // Si hay usuario, retornar tableros propios, compartidos y públicos
    const userObjectId = new Types.ObjectId(userId);
    return this.boardModel
      .find({
        $or: [
          { owner: userObjectId },
          { sharedWith: userObjectId },
          { isPublic: true },
          { owner: null },
          { owner: { $exists: false } },
        ],
      })
      .populate('owner', 'walletAddress username')
      .populate('sharedWith', 'walletAddress username')
      .exec();
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const updatedBoard = await this.boardModel
      .findByIdAndUpdate(id, updateBoardDto, { new: true })
      .exec();

    if (!updatedBoard) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return updatedBoard;
  }

  async remove(id: string): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    // Prevenir eliminación de tableros públicos
    if (board.isPublic) {
      throw new ForbiddenException('No se pueden eliminar tableros públicos');
    }

    // Eliminar todas las tareas asociadas al tablero
    await this.taskModel.deleteMany({ boardId: id }).exec();

    // Eliminar el tablero
    const deletedBoard = await this.boardModel.findByIdAndDelete(id).exec();
    if (!deletedBoard) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return deletedBoard;
  }

  async addColumn(id: string, columnName: string): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    // Verificar que la columna no exista ya
    if (board.columns.includes(columnName)) {
      throw new Error(`Column "${columnName}" already exists`);
    }

    board.columns.push(columnName);
    const savedBoard = await board.save();

    // Emitir evento WebSocket al room del tablero
    this.kanbanGateway.server.to(`board-${id}`).emit('column-added', {
      boardId: id,
      columnName,
      columns: savedBoard.columns,
      userId: 'anonymous', // No tenemos userId en addColumn, usar anonymous
      timestamp: new Date().toISOString(),
    });

    return savedBoard;
  }

  async renameColumn(
    id: string,
    oldName: string,
    newName: string,
  ): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    const columnIndex = board.columns.indexOf(oldName);
    if (columnIndex === -1) {
      throw new NotFoundException(`Column "${oldName}" not found`);
    }

    // Verificar que el nuevo nombre no exista ya
    if (board.columns.includes(newName)) {
      throw new Error(`Column "${newName}" already exists`);
    }

    board.columns[columnIndex] = newName;

    // Actualizar todas las tareas que están en la columna antigua
    await this.taskModel
      .updateMany({ column: oldName }, { $set: { column: newName } })
      .exec();

    const savedBoard = await board.save();

    // Emitir evento WebSocket al room del tablero
    this.kanbanGateway.server.to(`board-${id}`).emit('column-renamed', {
      boardId: id,
      oldName,
      newName,
      columns: savedBoard.columns,
      userId: 'anonymous', // No tenemos userId en renameColumn, usar anonymous
      timestamp: new Date().toISOString(),
    });

    return savedBoard;
  }

  async deleteColumn(id: string, columnName: string): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    const columnIndex = board.columns.indexOf(columnName);
    if (columnIndex === -1) {
      throw new NotFoundException(`Column "${columnName}" not found`);
    }

    board.columns.splice(columnIndex, 1);

    // Eliminar todas las tareas que están en esta columna
    await this.taskModel.deleteMany({ column: columnName }).exec();

    const savedBoard = await board.save();

    // Emitir evento WebSocket al room del tablero
    this.kanbanGateway.server.to(`board-${id}`).emit('column-deleted', {
      boardId: id,
      columnName,
      columns: savedBoard.columns,
      userId: 'anonymous', // No tenemos userId en deleteColumn, usar anonymous
      timestamp: new Date().toISOString(),
    });

    return savedBoard;
  }

  /**
   * Verifica si un usuario tiene permiso para acceder a un tablero
   */
  async hasAccess(boardId: string, userId?: string): Promise<boolean> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      return false;
    }

    // Solo tableros públicos son accesibles por usuarios no autenticados
    if (board.isPublic) {
      return true;
    }

    // Si no hay usuario autenticado, no tiene acceso a tableros privados
    if (!userId) {
      return false;
    }

    const userObjectId = new Types.ObjectId(userId);

    // Verificar si es el owner o está en sharedWith
    return (
      board.owner?.equals(userObjectId) ||
      board.sharedWith.some((id) => id.equals(userObjectId))
    );
  }

  /**
   * Verifica si un usuario es el owner del tablero
   */
  async isOwner(boardId: string, userId: string): Promise<boolean> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board || !board.owner) {
      return false;
    }

    const userObjectId = new Types.ObjectId(userId);
    return board.owner.equals(userObjectId);
  }

  /**
   * Compartir tablero con otro usuario (crear invitación)
   */
  async shareBoard(
    boardId: string,
    targetUserId: string,
    requestUserId: string,
  ): Promise<{ message: string; invitationId: string }> {
    // Verificar que el solicitante sea el owner
    if (!(await this.isOwner(boardId, requestUserId))) {
      throw new ForbiddenException(
        'Solo el propietario puede compartir el tablero',
      );
    }

    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    const targetUserObjectId = new Types.ObjectId(targetUserId);

    // Verificar que no esté ya compartido
    if (board.sharedWith.some((id) => id.equals(targetUserObjectId))) {
      throw new Error('El tablero ya está compartido con este usuario');
    }

    // Nota: La creación de la invitación se maneja ahora en el InvitationsService
    // Este método solo valida que el usuario tenga permisos para compartir
    return {
      message:
        'Invitación enviada correctamente. El usuario debe aceptarla para obtener acceso.',
      invitationId: 'pending', // Se reemplazará con el ID real cuando se implemente en el controlador
    };
  }

  /**
   * Remover acceso compartido
   */
  async unshareBoard(
    boardId: string,
    targetUserId: string,
    requestUserId: string,
  ): Promise<Board> {
    // Verificar que el solicitante sea el owner
    if (!(await this.isOwner(boardId, requestUserId))) {
      throw new ForbiddenException('Solo el propietario puede remover acceso');
    }

    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    const targetUserObjectId = new Types.ObjectId(targetUserId);
    board.sharedWith = board.sharedWith.filter(
      (id) => !id.equals(targetUserObjectId),
    );

    return board.save();
  }

  /**
   * Cambiar visibilidad del tablero (público/privado)
   */
  async togglePublic(boardId: string, userId: string): Promise<Board> {
    // Verificar que el solicitante sea el owner
    if (!(await this.isOwner(boardId, userId))) {
      throw new ForbiddenException(
        'Solo el propietario puede cambiar la visibilidad',
      );
    }

    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    board.isPublic = !board.isPublic;
    return board.save();
  }
}
