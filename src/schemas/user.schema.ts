// This schema defines the structure of user documents in the DB
import {
    Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Automatically add createdAt and updatedAt fields to the schema
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);