import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invitation, InvitationDocument } from '../schemas/invitation.schema';
import { Board, BoardDocument } from '../schemas/board.schema';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectModel(Invitation.name)
    private invitationModel: Model<InvitationDocument>,
    @InjectModel(Board.name)
    private boardModel: Model<BoardDocument>,
  ) {}

  /**
   * Crear una nueva invitación
   */
  async createInvitation(
    boardId: string,
    invitedBy: string,
    invitedUser: string,
  ): Promise<Invitation> {
    // Verificar que el tablero existe
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    // Verificar que el solicitante sea el owner
    if (!board.owner?.equals(new Types.ObjectId(invitedBy))) {
      throw new ForbiddenException(
        'Solo el propietario puede enviar invitaciones',
      );
    }

    // Verificar que no se esté invitando al mismo usuario que es el owner
    if (invitedBy === invitedUser) {
      throw new BadRequestException('No puedes invitarte a ti mismo');
    }

    // Verificar que no haya una invitación pendiente ya
    const existingInvitation = await this.invitationModel
      .findOne({
        boardId: new Types.ObjectId(boardId),
        invitedUser: new Types.ObjectId(invitedUser),
        status: 'pending',
      })
      .exec();

    if (existingInvitation) {
      throw new BadRequestException(
        'Ya existe una invitación pendiente para este usuario',
      );
    }

    // Verificar que el usuario no esté ya en el tablero
    const isAlreadyShared = board.sharedWith.some((id) =>
      id.equals(new Types.ObjectId(invitedUser)),
    );

    if (isAlreadyShared) {
      throw new BadRequestException(
        'El usuario ya tiene acceso a este tablero',
      );
    }

    // Crear la invitación
    const invitation = new this.invitationModel({
      boardId: new Types.ObjectId(boardId),
      invitedBy: new Types.ObjectId(invitedBy),
      invitedUser: new Types.ObjectId(invitedUser),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    });

    return invitation.save();
  }

  /**
   * Obtener invitaciones pendientes de un usuario
   */
  async getPendingInvitations(userId: string): Promise<Invitation[]> {
    return this.invitationModel
      .find({
        invitedUser: new Types.ObjectId(userId),
        status: 'pending',
      })
      .populate('boardId', 'name isPublic owner')
      .populate('invitedBy', 'walletAddress username')
      .exec();
  }

  /**
   * Aceptar una invitación
   */
  async acceptInvitation(
    invitationId: string,
    userId: string,
  ): Promise<{ invitation: Invitation; board: Board }> {
    const invitation = await this.invitationModel.findById(invitationId).exec();
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    // Verificar que el usuario sea el invitado
    if (!invitation.invitedUser.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException(
        'No tienes permisos para aceptar esta invitación',
      );
    }

    // Verificar que la invitación esté pendiente
    if (invitation.status !== 'pending') {
      throw new BadRequestException('Esta invitación ya fue respondida');
    }

    // Verificar que no haya expirado
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Esta invitación ha expirado');
    }

    // Obtener el tablero
    const board = await this.boardModel.findById(invitation.boardId).exec();
    if (!board) {
      throw new NotFoundException('Tablero no encontrado');
    }

    // Verificar que el usuario no esté ya en el tablero
    const isAlreadyShared = board.sharedWith.some((id) =>
      id.equals(invitation.invitedUser),
    );

    if (isAlreadyShared) {
      // Si ya está en el tablero, solo marcar la invitación como aceptada
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      await invitation.save();
      return { invitation, board };
    }

    // Agregar el usuario al tablero
    board.sharedWith.push(invitation.invitedUser);
    await board.save();

    // Marcar la invitación como aceptada
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    return { invitation, board };
  }

  /**
   * Rechazar una invitación
   */
  async rejectInvitation(
    invitationId: string,
    userId: string,
  ): Promise<Invitation> {
    const invitation = await this.invitationModel.findById(invitationId).exec();
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    // Verificar que el usuario sea el invitado
    if (!invitation.invitedUser.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException(
        'No tienes permisos para rechazar esta invitación',
      );
    }

    // Verificar que la invitación esté pendiente
    if (invitation.status !== 'pending') {
      throw new BadRequestException('Esta invitación ya fue respondida');
    }

    // Marcar la invitación como rechazada
    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    return invitation.save();
  }

  /**
   * Abandonar un tablero (remover acceso)
   */
  async leaveBoard(boardId: string, userId: string): Promise<Board> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      throw new NotFoundException('Tablero no encontrado');
    }

    // Verificar que el usuario no sea el owner
    if (board.owner?.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException(
        'El propietario no puede abandonar su propio tablero',
      );
    }

    // Verificar que el usuario esté en sharedWith
    const userIndex = board.sharedWith.findIndex((id) =>
      id.equals(new Types.ObjectId(userId)),
    );

    if (userIndex === -1) {
      throw new BadRequestException('No tienes acceso a este tablero');
    }

    // Remover el usuario del tablero
    board.sharedWith.splice(userIndex, 1);
    return board.save();
  }

  /**
   * Obtener invitaciones enviadas por un usuario
   */
  async getSentInvitations(userId: string): Promise<Invitation[]> {
    return this.invitationModel
      .find({
        invitedBy: new Types.ObjectId(userId),
      })
      .populate('boardId', 'name isPublic')
      .populate('invitedUser', 'walletAddress username')
      .exec();
  }
}
