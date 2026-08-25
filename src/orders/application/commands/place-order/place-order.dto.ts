export interface PlaceOrderItemDto {
  productId: string;
  quantity: number;
  price: number;
}

export interface PlaceOrderRequest {
  customerId: string;
  storeId: string;
  items: PlaceOrderItemDto[];
}

export interface PlaceOrderResponse {
  orderId: string;
  status: string;
  message: string;
}
