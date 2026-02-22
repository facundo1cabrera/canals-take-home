import { injectable, inject } from 'tsyringe';
import { sql } from '@repo/db';
import { KYSELY_TOKEN, type KyselyDb } from '../lib/kysely';

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
  constructor(@inject(KYSELY_TOKEN) private db: KyselyDb) {}

  async findProductsByIds(ids: string[]): Promise<ProductRecord[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .selectFrom('products')
      .select(['id', 'price'])
      .where('id', 'in', ids)
      .execute();
    return rows.map((p) => ({ id: p.id, price: p.price }));
  }

  async findWarehousesWithInventoryForItems(
    items: { productId: string; quantity: number }[]
  ): Promise<WarehouseWithCoords[]> {
    const productIds = [...new Set(items.map((i) => i.productId))];
    if (productIds.length === 0) return [];

    const inventory = await this.db
      .selectFrom('inventory')
      .innerJoin('warehouses', 'warehouses.id', 'inventory.warehouseId')
      .select([
        'inventory.warehouseId',
        'inventory.productId',
        'inventory.quantity',
        'warehouses.id as warehouseId',
        'warehouses.latitude',
        'warehouses.longitude',
      ])
      .where('inventory.productId', 'in', productIds)
      .execute();

    const byWarehouse = new Map<string, Map<string, number>>();
    const warehouseCoords = new Map<string, { latitude: number; longitude: number }>();
    for (const inv of inventory) {
      if (!byWarehouse.has(inv.warehouseId)) {
        byWarehouse.set(inv.warehouseId, new Map());
        warehouseCoords.set(inv.warehouseId, {
          latitude: inv.latitude,
          longitude: inv.longitude,
        });
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
        const coords = warehouseCoords.get(warehouseId);
        if (coords) {
          warehousesWithEnough.push({
            id: warehouseId,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        }
      }
    }
    return warehousesWithEnough;
  }

  async createAddress(data: CreateAddressInput): Promise<{ id: string }> {
    const [row] = await this.db
      .insertInto('addresses')
      .values({
        customerId: data.customerId,
        street: data.street,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      .returning('id')
      .execute();
    if (!row) throw new Error('Failed to create address');
    return { id: row.id };
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
    const [order] = await this.db
      .insertInto('orders')
      .values({
        customerId: input.customerId,
        warehouseId: input.warehouseId,
        shippingAddressId: input.shippingAddressId,
        totalAmount: input.totalAmount,
        status: input.status,
      })
      .returningAll()
      .execute();
    if (!order) throw new Error('Failed to create order');

    if (input.items.length > 0) {
      await this.db
        .insertInto('order_items')
        .values(
          input.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        )
        .execute();
    }

    const orderItems = await this.db
      .selectFrom('order_items')
      .select(['id', 'productId', 'quantity', 'unitPrice'])
      .where('orderId', '=', order.id)
      .execute();

    return {
      id: order.id,
      customerId: order.customerId,
      warehouseId: order.warehouseId,
      shippingAddressId: order.shippingAddressId,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt),
      items: orderItems,
    };
  }

  async decrementInventory(
    warehouseId: string,
    items: { productId: string; quantity: number }[]
  ): Promise<void> {
    for (const item of items) {
      await this.db
        .updateTable('inventory')
        .set({ quantity: sql`quantity - ${item.quantity}` })
        .where('warehouseId', '=', warehouseId)
        .where('productId', '=', item.productId)
        .execute();
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
    const orders = await this.db
      .selectFrom('orders')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();

    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    const orderItems = await this.db
      .selectFrom('order_items')
      .select(['id', 'orderId', 'productId', 'quantity', 'unitPrice'])
      .where('orderId', 'in', orderIds)
      .execute();

    const itemsByOrderId = new Map<string, { id: string; productId: string; quantity: number; unitPrice: number }[]>();
    for (const i of orderItems) {
      const list = itemsByOrderId.get(i.orderId) ?? [];
      list.push({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      });
      itemsByOrderId.set(i.orderId, list);
    }

    return orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      warehouseId: order.warehouseId,
      shippingAddressId: order.shippingAddressId,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt),
      items: itemsByOrderId.get(order.id) ?? [],
    }));
  }
}
