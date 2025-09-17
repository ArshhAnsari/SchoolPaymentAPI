import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { WebhookLog, WebhookLogDocument } from '../schemas/webhook-logs.schema';
import { OrderStatus, OrderStatusDocument } from '../schemas/order-status.schema';
 
@Injectable()
export class TransactionsService {
  private readonly pgApiUrl = 'https://dev-vanilla.edviron.com/erp/create-collect-request';

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatus.name) private orderStatusModel: Model<OrderStatusDocument>,
    @InjectModel(WebhookLog.name) private webhookLogModel: Model<WebhookLogDocument>,
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  private createPaymentGatewaySign(payload: object): string {
    const secret = this.configService.get<string>('PG_KEY', ''); // Fallback for type safety
    return jwt.sign(payload, secret);
  }

  async createPaymentRequest(
    createTransactionDto: CreateTransactionDto,
  ): Promise<string> {
    const { amount, callback_url, school_id, student_info } = createTransactionDto;

    const newOrder = new this.orderModel({
      school_id,
      student_info,
    });
    await newOrder.save();

    const signPayload = {
      school_id,
      amount: amount.toString(),
      callback_url,
    };
    const sign = this.createPaymentGatewaySign(signPayload);

    const requestBody = { ...signPayload, sign };
    const apiKey = this.configService.get<string>('API_KEY');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.pgApiUrl, requestBody, { headers }),
      );
      console.log('--- Successful Gateway Response ---', response.data);

      const paymentUrl = response.data.collect_request_url;
      if (!paymentUrl) {
        throw new Error('Payment URL not found in gateway response');
      }

      return paymentUrl;
    } catch (error) {
      console.error('--- Full Axios Error Object ---');
      console.error(error); // This will print the complete error object
      console.error('-----------------------------');
      throw new InternalServerErrorException('Could not create payment request.');
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    const log = new this.webhookLogModel({ payload });
    await log.save();

    const { order_info } = payload;
    if (!order_info) {
      console.error('Webhook payload is missing order_info');
      return;
    }
    const collectId = order_info.order_id;

    const order = await this.orderModel.findById(collectId).exec();
    if (!order) {
        console.error(`Order with collect_id ${collectId} not found.`);
        return;
    }

    await this.orderStatusModel.findOneAndUpdate(
      { collect_id: collectId },
      {
        collect_id: order._id,
        order_amount: order_info.order_amount,
        transaction_amount: order_info.transaction_amount,
        payment_mode: order_info.payment_mode,
        payment_details: order_info.payemnt_details,
        bank_reference: order_info.bank_reference,
        payment_message: order_info.Payment_message,
        status: order_info.status,
        error_message: order_info.error_message,
        payment_time: new Date(order_info.payment_time),
      },
      { upsert: true, new: true },
    );
  }
  
  async findAll(): Promise<any[]> {
    return this.orderStatusModel.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'collect_id',
          foreignField: '_id',
          as: 'orderDetails',
        },
      },
      {
        $unwind: '$orderDetails',
      },
      {
        $project: {
          _id: 0,
          collect_id: '$_id',
          school_id: '$orderDetails.school_id',
          gateway: '$orderDetails.gateway_name',
          order_amount: '$order_amount',
          transaction_amount: '$transaction_amount',
          status: '$status',
          custom_order_id: '$collect_id',
        },
      },
    ]);
  }

  async findAllBySchool(schoolId: string): Promise<any[]> {
    return this.orderStatusModel.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'collect_id',
          foreignField: '_id',
          as: 'orderDetails',
        },
      },
      { $unwind: '$orderDetails' },
      {
        $match: { 'orderDetails.school_id': schoolId },
      },
      {
        $project: {
          _id: 0,
          collect_id: '$_id',
          school_id: '$orderDetails.school_id',
          gateway: '$orderDetails.gateway_name',
          order_amount: '$order_amount',
          transaction_amount: '$transaction_amount',
          status: '$status',
          custom_order_id: '$collect_id',
        },
      },
    ]);
  }

  async findStatusById(orderId: string): Promise<{ status: string }> {
    const transaction = await this.orderStatusModel
      .findOne({ collect_id: orderId })
      .select('status')
      .exec();

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${orderId} not found.`);
    }

    return { status: transaction.status };
  }
}