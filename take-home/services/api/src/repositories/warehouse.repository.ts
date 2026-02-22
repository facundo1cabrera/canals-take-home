import { injectable, inject } from 'tsyringe';
import { KYSELY_TOKEN, type KyselyDb } from '../lib/kysely';

export interface WarehouseRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface InventoryRecord {
  warehouseId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

@injectable()
export class WarehouseRepository {
  constructor(@inject(KYSELY_TOKEN) private db: KyselyDb) {}

  async findMany(): Promise<WarehouseRecord[]> {
    return this.db
      .selectFrom('warehouses')
      .select(['id', 'name', 'latitude', 'longitude'])
      .orderBy('name', 'asc')
      .execute();
  }

  async findAllInventoryWithProducts(): Promise<InventoryRecord[]> {
    return this.db
      .selectFrom('inventory')
      .innerJoin('products', 'products.id', 'inventory.productId')
      .select([
        'inventory.warehouseId',
        'inventory.productId',
        'products.name as productName',
        'products.price as productPrice',
        'inventory.quantity',
      ])
      .orderBy('products.name', 'asc')
      .execute();
  }
}
