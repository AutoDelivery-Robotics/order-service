import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { CancelOrderCommand } from './cancel-order.command';
import { Order } from '../../../infrastructure/entities/order.entity';
import { OrderStatusHistory } from '../../../infrastructure/entities/order-status-history.entity';
import { OrderStatus } from '../../../enums/order-status.enum';

import type { CancelOrderResponse } from './cancel-order.dto';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  private readonly logger = new Logger(CancelOrderHandler.name);

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private historyRepo: Repository<OrderStatusHistory>,
  ) {}

  async execute(command: CancelOrderCommand): Promise<CancelOrderResponse> {
    const { orderId, reason } = command;
    this.logger.log(
      `[CQRS] Đang xử lý CancelOrderCommand cho order: ${orderId}`,
    );

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new Error(`Cannot cancel order in status ${order.status}`);
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);

    const statusHistory = new OrderStatusHistory();
    statusHistory.order = order;
    statusHistory.toStatus = OrderStatus.CANCELLED;
    statusHistory.reason = reason || 'Đơn hàng bị hủy';
    await this.historyRepo.save(statusHistory);

    // Bắn event hủy đơn hàng lên Kafka
    this.kafkaClient.emit('order.cancelled', {
      orderId: order.id,
      reason: reason,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`[CQRS] Hủy đơn hàng thành công: ${order.id}`);

    return {
      status: 'CANCELLED',
      message: 'Order cancelled successfully',
    };
  }
}
