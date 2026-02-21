import { injectable, inject } from 'tsyringe';
import { PRISMA_TOKEN, type PrismaTransaction } from '../lib/prisma';

export interface ProductRecord {
  id: string;
  price: number;
}

export interface WarehouseWithCoords {
  id: string;
  latitude: number;
  longitude: number;
}

export interface CreateAddressInput {
  customerId: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface CreateOrderInput {
  customerId: string;
  warehouseId: string;
  shippingAddressId: string;
  totalAmount: number;
  status: 'PAID';
  items: { productId: string; quantity: number; unitPrice: number }[];
}

@injectable()
export class OrderRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaTransaction) {}

  async findProductsByIds(ids: string[]): Promise<ProductRecord[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, price: true },
    });
    return products.map((p: { id: string; price: number }) => ({ id: p.id, price: p.price }));
  }

  async findWarehousesWithInventoryForItems(
    items: { productId: string; quantity: number }[]
  ): Promise<WarehouseWithCoords[]> {
    const productIds = items.map((i) => i.productId);
    const inventory = await this.prisma.inventory.findMany({
      where: { productId: { in: productIds } },
      include: { warehouse: true },
    });
    const byWarehouse = new Map<string, Map<string, number>>();
    for (const inv of inventory) {
      if (!byWarehouse.has(inv.warehouseId)) {
        byWarehouse.set(inv.warehouseId, new Map());
      }
      byWarehouse.get(inv.warehouseId)!.set(inv.productId, inv.quantity);
    }
    const warehousesWithEnough: WarehouseWithCoords[] = [];
    for (const [warehouseId, productQtys] of byWarehouse) {
      const hasAll = items.every((item) => {
        const qty = productQtys.get(item.productId) ?? 0;
        return qty >= item.quantity;
      });
      if (hasAll) {
        const invRow = inventory.find((i: { warehouseId: string; warehouse: { id: string; latitude: number; longitude: number } }) => i.warehouseId === warehouseId);
        if (invRow) {
          warehousesWithEnough.push({
            id: invRow.warehouse.id,
            latitude: invRow.warehouse.latitude,
            longitude: invRow.warehouse.longitude,
          });
        }
      }
    }
    return warehousesWithEnough;
  }

  async createAddress(data: CreateAddressInput): Promise<{ id: string }> {
    const address = await this.prisma.address.create({
      data: {
        customerId: data.customerId,
        street: data.street,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      select: { id: true },
    });
    return address;
  }

  async createOrderWithItems(input: CreateOrderInput): Promise<{
    id: string;
    customerId: string;
    warehouseId: string;
    shippingAddressId: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    items: { id: string; productId: string; quantity: number; unitPrice: number }[];
  }> {
    const order = await this.prisma.order.create({
      data: {
        customerId: input.customerId,
        warehouseId: input.warehouseId,
        shippingAddressId: input.shippingAddressId,
        totalAmount: input.totalAmount,
        status: input.status,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
    return order;
  }

  async decrementInventory(
    warehouseId: string,
    items: { productId: string; quantity: number }[]
  ): Promise<void> {
    for (const item of items) {
      await this.prisma.inventory.updateMany({
        where: {
          warehouseId,
          productId: item.productId,
        },
        data: {
          quantity: { decrement: item.quantity },
        },
      });
    }
  }

  async findManyOrdersWithItems(): Promise<
    {
      id: string;
      customerId: string;
      warehouseId: string;
      shippingAddressId: string;
      totalAmount: number;
      status: string;
      createdAt: Date;
      items: { id: string; productId: string; quantity: number; unitPrice: number }[];
    }[]
  > {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return orders;
  }
}
