import { Controller, Post, Body, Res, HttpStatus, HttpCode, UseGuards ,Get,Param,NotFoundException} from '@nestjs/common';
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionService: TransactionsService) { }
    
    @UseGuards(JwtAuthGuard)
    @Post('create-payment')
    @HttpCode(HttpStatus.FOUND)
    async createPayment(
        @Body() createTransactionDto: CreateTransactionDto,
        @Res() res: Response,
    ) {
        const paymentUrl = await this.transactionService.createPaymentRequest(createTransactionDto);
        res.redirect(paymentUrl);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async webhook(@Body() payload: any) {
        await this.transactionService.handleWebhook(payload);
    }

    @Get()
    async getAllTransactions() {
        return this.transactionService.findAll();
    }

    @Get('school/:schoolId')
    async getTransactionsBySchool(@Param('schoolId') schoolId: string) {
        return this.transactionService.findAllBySchool(schoolId);
    }

    @Get('status/:id')
    async getTransactionStatus(@Param('id') id: string) {
        return this.transactionService.findStatusById(id);
    }
}