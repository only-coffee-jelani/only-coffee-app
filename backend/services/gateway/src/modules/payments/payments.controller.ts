import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  RawBodyRequest,
  Req,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@shared/database/entities';
import { PaymentsService } from './payments.service';
import { PaymentService } from '@shared/services';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { AttachPaymentMethodDto } from './dto/attach-payment-method.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post('create-intent')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Create payment intent for an order (guest or authenticated)',
    description: 'Create a Stripe payment intent for an order. Supports both guest and authenticated users.'
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
  })
  async createPaymentIntent(
    @CurrentUser() user: User | null,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    const userId = user?.userId || null;
    return this.paymentsService.createPaymentIntent(
      userId,
      createPaymentIntentDto,
    );
  }

  @Post('confirm')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Confirm payment intent (guest or authenticated)' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  async confirmPayment(
    @CurrentUser() user: User | null,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ) {
    const userId = user?.userId || null;
    return this.paymentsService.confirmPayment(userId, confirmPaymentDto);
  }

  @Get('intent/:paymentIntentId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get payment intent details (guest or authenticated)' })
  @ApiResponse({
    status: 200,
    description: 'Payment intent details retrieved',
  })
  async getPaymentIntent(
    @CurrentUser() user: User | null,
    @Param('paymentIntentId') paymentIntentId: string,
  ) {
    const userId = user?.userId || null;
    return this.paymentsService.getPaymentIntent(userId, paymentIntentId);
  }

  @Delete('intent/:paymentIntentId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Cancel payment intent (guest or authenticated)' })
  @ApiResponse({ status: 200, description: 'Payment intent canceled' })
  async cancelPaymentIntent(
    @CurrentUser() user: User | null,
    @Param('paymentIntentId') paymentIntentId: string,
  ) {
    const userId = user?.userId || null;
    return this.paymentsService.cancelPaymentIntent(userId, paymentIntentId);
  }

  @Post('payment-methods/attach')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach payment method to customer (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Payment method attached' })
  async attachPaymentMethod(
    @CurrentUser() user: User,
    @Body() attachPaymentMethodDto: AttachPaymentMethodDto,
  ) {
    return this.paymentsService.attachPaymentMethod(
      user.userId,
      attachPaymentMethodDto.paymentMethodId,
    );
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'List saved payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
  async listPaymentMethods(@CurrentUser() user: User) {
    return this.paymentsService.listPaymentMethods(user.userId);
  }

  @Delete('payment-methods/:paymentMethodId')
  @ApiOperation({ summary: 'Remove payment method' })
  @ApiResponse({ status: 200, description: 'Payment method removed' })
  async detachPaymentMethod(
    @CurrentUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.paymentsService.detachPaymentMethod(user.userId, paymentMethodId);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // Stripe requires the raw body for signature verification
    const event = this.paymentService.constructWebhookEvent(
      request.rawBody,
      signature,
    );

    await this.paymentsService.handleWebhookEvent(event);

    return { received: true };
  }
}
