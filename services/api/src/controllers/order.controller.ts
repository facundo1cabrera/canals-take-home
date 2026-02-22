import { injectable, inject } from 'tsyringe';
import { OrderService } from '../services/order.service';
import type { ServerInferRequest, ServerInferResponses } from '@ts-rest/core';
import { contract } from '@repo/contracts';

type GetOrdersResponse = ServerInferResponses<typeof contract.getOrders>;
type CreateOrderResponse = ServerInferResponses<typeof contract.createOrder>;
type CreateOrderBody = ServerInferRequest<typeof contract.createOrder>['body'];

@injectable()
export class OrderController {
  constructor(@inject(OrderService) private orderService: OrderService) {}

  getOrders = async (): Promise<GetOrdersResponse> => {
    const orders = await this.orderService.getOrders();
    return { status: 200, body: orders };
  };

  createOrder = async (body: CreateOrderBody): Promise<CreateOrderResponse> => {
    const order = await this.orderService.createOrder(body);
    return { status: 201, body: order };
  };
}
