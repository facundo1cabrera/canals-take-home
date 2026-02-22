import { injectable, inject } from 'tsyringe';
import type { contract, CreateOrderBody, CreateOrderResponse } from '@repo/contracts';
import { OrderRepository } from '../repositories/order.repository';
import { GeocodingService } from './geocoding.service';
import { PaymentService } from './payment.service';
import { BadRequestError, NotFoundError } from '../lib/errors';
import { ServerInferResponses } from '@ts-rest/core';

type GetOrdersResponse = ServerInferResponses<typeof contract.getOrders>;
type GetOrdersResponseBody = Extract<GetOrdersResponse, { status: 200 }>['body'];

@injectable()
export class OrderService {
  constructor(
    @inject(OrderRepository) private orderRepository: OrderRepository,
    @inject(GeocodingService) private geocodingService: GeocodingService,
    @inject(PaymentService) private paymentService: PaymentService
  ) {}

  async getOrders(): Promise<GetOrdersResponseBody> {
    const orders = await this.orderRepository.findManyOrdersWithItems();

    return orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      warehouseId: order.warehouseId,
      shippingAddressId: order.shippingAddressId,
      totalAmount: (order.totalAmount / 100).toFixed(2),
      status: order.status as GetOrdersResponseBody[number]['status'],
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: (i.unitPrice / 100).toFixed(2),
      })),
    }));
  }

  async createOrder(body: CreateOrderBody): Promise<CreateOrderResponse> {
    const { customerId, shippingAddress, items, creditCardNumber } = body;

    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await this.orderRepository.findProductsByIds(productIds);
    
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundError(`Products not found: ${missing.join(', ')}`);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const { latitude, longitude } = this.geocodingService.geocode(shippingAddress.postalCode);

    const closest = await this.orderRepository.findNearestWarehouseWithInventoryForItems(items, {
      latitude,
      longitude,
    });

    if (!closest) {
      throw new BadRequestError('No warehouse has sufficient inventory for all items');
    }

    let totalAmountCents = 0;

    const orderItems: { productId: string; quantity: number; unitPrice: number }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const unitPriceCents = product.price;
      totalAmountCents += unitPriceCents * item.quantity;
      orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: unitPriceCents });
    }

    this.paymentService.charge(creditCardNumber, totalAmountCents);

    const address = await this.orderRepository.createAddress({
      customerId,
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      country: shippingAddress.country,
      postalCode: shippingAddress.postalCode,
      latitude,
      longitude,
    });

    const order = await this.orderRepository.createOrderWithItems({
      customerId,
      warehouseId: closest.id,
      shippingAddressId: address.id,
      totalAmount: totalAmountCents,
      status: 'PAID',
      items: orderItems,
    });

    await this.orderRepository.decrementInventory(closest.id, items);

    return {
      id: order.id,
      customerId: order.customerId,
      warehouseId: order.warehouseId,
      shippingAddressId: order.shippingAddressId,
      totalAmount: (order.totalAmount / 100).toFixed(2),
      status: order.status as CreateOrderResponse['status'],
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: (i.unitPrice / 100).toFixed(2),
      })),
    };
  }
}
