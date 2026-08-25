import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { PlaceOrderCommand } from './place-order.command';
import { Order } from '../../../infrastructure/entities/order.entity';
import { OrderItem } from '../../../infrastructure/entities/order-item.entity';
import { OrderStatusHistory } from '../../../infrastructure/entities/order-status-history.entity';
import { OrderStatus } from '../../../enums/order-status.enum';

import type { PlaceOrderResponse } from './place-order.dto';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand> {
  private readonly logger = new Logger(PlaceOrderHandler.name);

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<PlaceOrderResponse> {
    const { customerId, storeId, items } = command;
    this.logger.log(
      `[CQRS] Đang xử lý PlaceOrderCommand cho customer: ${customerId}`,
    );

    // Tính tổng tiền
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Tạo đơn hàng (PENDING)
    const orderItems = items.map((i) => {
      const item = new OrderItem();
      item.productId = i.productId;
      item.quantity = i.quantity;
      item.price = i.price;
      return item;
    });

    const statusHistory = new OrderStatusHistory();
    statusHistory.toStatus = OrderStatus.PENDING;
    statusHistory.reason = 'Đơn hàng mới được tạo';

    let order = this.orderRepo.create({
      customerId,
      storeId,
      status: OrderStatus.PENDING,
      totalAmount,
      items: orderItems,
      statusHistory: [statusHistory],
    });

    order = await this.orderRepo.save(order);

    // Bắn event tạo đơn hàng lên Kafka
    this.kafkaClient.emit('order.created', {
      orderId: order.id,
      customerId: order.customerId,
      storeId: order.storeId,
      totalAmount: order.totalAmount,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`[CQRS] Tạo đơn hàng thành công: ${order.id}`);

    return {
      orderId: order.id,
      status: order.status,
      message: 'Order placed successfully',
    };
  }
}
