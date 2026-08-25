import { PlaceOrderItemDto } from './place-order.dto';

export class PlaceOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly storeId: string,
    public readonly items: PlaceOrderItemDto[],
  ) {}
}
