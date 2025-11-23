import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvitationDocument = Invitation & Document;

@Schema({ timestamps: true })
export class Invitation {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId; // Usuario que envía la invitación (owner del tablero)

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedUser: Types.ObjectId; // Usuario invitado

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status: 'pending' | 'accepted' | 'rejected';

  @Prop({ type: Date })
  expiresAt?: Date; // Fecha de expiración de la invitación (opcional)

  @Prop({ type: Date })
  respondedAt?: Date; // Fecha cuando se respondió la invitación
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);

// Índices para optimizar consultas
InvitationSchema.index({ boardId: 1, invitedUser: 1 });
InvitationSchema.index({ invitedUser: 1, status: 1 });
InvitationSchema.index({ boardId: 1, status: 1 });
