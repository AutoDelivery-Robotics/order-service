import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from '../../enums/order-status.enum';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    name: 'from_status',
    nullable: true,
  })
  fromStatus!: OrderStatus | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    name: 'to_status',
  })
  toStatus!: OrderStatus;

  @Column({ nullable: true })
  reason!: string;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt!: Date;
}
