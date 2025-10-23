import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BoardDocument = Board & Document;

@Schema({ timestamps: true })
export class Board {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], default: ['Por Hacer', 'En Progreso', 'Completado'] })
  columns: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  owner?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  sharedWith: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isPublic: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const BoardSchema = SchemaFactory.createForClass(Board);

// Índices
BoardSchema.index({ owner: 1 });
BoardSchema.index({ sharedWith: 1 });
