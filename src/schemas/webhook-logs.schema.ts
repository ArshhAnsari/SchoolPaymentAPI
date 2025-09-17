// This schema is for logging incoming webhook payloads

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookLogDocument = WebhookLog & Document;

@Schema({ timestamps: true, strict: false }) // This allows storing the raw payload without predefined fields 
export class WebhookLog {
  @Prop({ type: Object })
  payload: Record<string, any>;
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);