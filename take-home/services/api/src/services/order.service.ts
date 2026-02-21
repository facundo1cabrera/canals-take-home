import { injectable, inject } from 'tsyringe';
import { CreateOrderBodySchema, type CreateOrderResponse } from '@repo/contracts';
import { OrderRepository } from '../repositories/order.repository';
import { GeocodingService } from './geocoding.service';
import { PaymentService } from './payment.service';
import { BadRequestError, NotFoundError } from '../lib/errors';

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@injectable()
export class OrderService {
  constructor(
    @inject(OrderRepository) private orderRepository: OrderRepository,
    @inject(GeocodingService) private geocodingService: GeocodingService,
    @inject(PaymentService) private paymentService: PaymentService
  ) {}

  async getOrders(): Promise<CreateOrderResponse[]> {
    const orders = await this.orderRepository.findManyOrdersWithItems();
    return orders.map((order) => ({
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
    }));
  }

  createOrder(body: unknown): Promise<CreateOrderResponse> {
    const parsed = CreateOrderBodySchema.safeParse(body);
    if (!parsed.success) {
      throw parsed.error;
    }
    const { customerId, shippingAddress, items, creditCardNumber } = parsed.data;

    return this.runCreateOrder(customerId, shippingAddress, items, creditCardNumber);
  }

  private async runCreateOrder(
    customerId: string,
    shippingAddress: { street: string; city: string; state: string; country: string; postalCode: string },
    items: { productId: string; quantity: number }[],
    creditCardNumber: string
  ): Promise<CreateOrderResponse> {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await this.orderRepository.findProductsByIds(productIds);
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundError(`Products not found: ${missing.join(', ')}`);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const warehouses = await this.orderRepository.findWarehousesWithInventoryForItems(items);
    if (warehouses.length === 0) {
      throw new BadRequestError('No warehouse has sufficient inventory for all items');
    }

    const { latitude, longitude } = this.geocodingService.geocode(shippingAddress.postalCode);

    let closest = warehouses[0]!;
    let minDist = Infinity;
    for (const w of warehouses) {
      const dist = haversineDistance(
        latitude,
        longitude,
        w.latitude,
        w.longitude
      );
      if (dist < minDist) {
        minDist = dist;
        closest = w;
      }
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
