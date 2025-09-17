// This schema stores the intial information before a payment is attempted

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Student_info object
class StudentInfo {
    @Prop({ required: true })
    name: string;
    @Prop({ required: true })
    age: number;
    @Prop({ required: true })
    email: string;
}

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
    @Prop({ required: true })
    school_id: string;

    @Prop()
    trustee_id: string;

    @Prop({ type: StudentInfo, required: true })
    student_info: StudentInfo;

    @Prop()
    gateway_name: string;
}
export const OrderSchema = SchemaFactory.createForClass(Order);