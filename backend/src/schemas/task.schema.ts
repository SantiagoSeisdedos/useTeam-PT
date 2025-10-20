import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  column: string;

  @Prop({ required: true, default: 0 })
  position: number;

  @Prop({ type: String, default: null })
  color: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
  boardId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
