import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';
import { PlaceOrderCommand } from '../application/commands/place-order/place-order.command';
import type {
  PlaceOrderRequest,
  PlaceOrderResponse,
} from '../application/commands/place-order/place-order.dto';

import { CancelOrderCommand } from '../application/commands/cancel-order/cancel-order.command';
import type {
  CancelOrderRequest,
  CancelOrderResponse,
} from '../application/commands/cancel-order/cancel-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly commandBus: CommandBus) {}

  @GrpcMethod('OrderService', 'PlaceOrder')
  async placeOrder(data: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    return this.commandBus.execute<PlaceOrderCommand, PlaceOrderResponse>(
      new PlaceOrderCommand(data.customerId, data.storeId, data.items),
    );
  }

  @GrpcMethod('OrderService', 'CancelOrder')
  async cancelOrder(data: CancelOrderRequest): Promise<CancelOrderResponse> {
    return this.commandBus.execute<CancelOrderCommand, CancelOrderResponse>(
      new CancelOrderCommand(data.orderId, data.reason),
    );
  }
}
