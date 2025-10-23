import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  walletAddress: string;

  @Prop()
  username?: string;

  @Prop()
  email?: string;

  @Prop({ default: null })
  nonce?: string;

  @Prop({ default: Date.now })
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices
UserSchema.index({ walletAddress: 1 });
