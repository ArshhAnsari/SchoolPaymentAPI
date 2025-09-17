// This schema stores the detailed transaction information received from the payment gateway.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Order } from './order.schema';

export type OrderStatusDocument = OrderStatus & Document;

@Schema({ timestamps: true })
export class OrderStatus {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Order',
        required: true,
    })
    collect_id: Order; // Reference to Order schema

    @Prop({ required: true })
    order_amount: number;

    @Prop()
    transaction_amount: number;

    @Prop()
    payment_mode: string;

    @Prop()
    bank_reference: string;

    @Prop()
    payment_message: string;

    @Prop({ required: true })
    status: string; // e.g., 'SUCCESS', 'PENDING', 'FAILED'

    @Prop()
    error_message: string;

    @Prop()
    payment_time: Date;
}

export const OrderStatusSchema = SchemaFactory.createForClass(OrderStatus);