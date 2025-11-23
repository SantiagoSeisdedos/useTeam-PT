import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * Crear una nueva invitación
   */
  @Post()
  async createInvitation(
    @Body() body: { boardId: string; invitedUserId: string },
    @Request() req: any,
  ) {
    return this.invitationsService.createInvitation(
      body.boardId,
      req.user.userId,
      body.invitedUserId,
    );
  }

  /**
   * Obtener invitaciones pendientes del usuario autenticado
   */
  @Get('pending')
  async getPendingInvitations(@Request() req: any) {
    return this.invitationsService.getPendingInvitations(req.user.userId);
  }

  /**
   * Obtener invitaciones enviadas por el usuario autenticado
   */
  @Get('sent')
  async getSentInvitations(@Request() req: any) {
    return this.invitationsService.getSentInvitations(req.user.userId);
  }

  /**
   * Aceptar una invitación
   */
  @Patch(':id/accept')
  async acceptInvitation(
    @Param('id') invitationId: string,
    @Request() req: any,
  ) {
    return this.invitationsService.acceptInvitation(
      invitationId,
      req.user.userId,
    );
  }

  /**
   * Rechazar una invitación
   */
  @Patch(':id/reject')
  async rejectInvitation(
    @Param('id') invitationId: string,
    @Request() req: any,
  ) {
    return this.invitationsService.rejectInvitation(
      invitationId,
      req.user.userId,
    );
  }

  /**
   * Abandonar un tablero
   */
  @Post(':boardId/leave')
  async leaveBoard(@Param('boardId') boardId: string, @Request() req: any) {
    return this.invitationsService.leaveBoard(boardId, req.user.userId);
  }
}
