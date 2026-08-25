export interface CancelOrderRequest {
  orderId: string;
  reason: string;
}

export interface CancelOrderResponse {
  status: string;
  message: string;
}
