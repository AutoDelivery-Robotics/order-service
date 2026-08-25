import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { OrdersController } from './interface/orders.controller';
import { Order } from './infrastructure/entities/order.entity';
import { OrderItem } from './infrastructure/entities/order-item.entity';
import { OrderStatusHistory } from './infrastructure/entities/order-status-history.entity';
import { PlaceOrderHandler } from './application/commands/place-order/place-order.handler';
import { CancelOrderHandler } from './application/commands/cancel-order/cancel-order.handler';

const CommandHandlers = [PlaceOrderHandler, CancelOrderHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory]),
  ],
  controllers: [OrdersController],
  providers: [...CommandHandlers],
})
export class OrdersModule {}
