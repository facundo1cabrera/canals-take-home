import { injectable, inject } from 'tsyringe';
import { WarehouseRepository } from '../repositories/warehouse.repository';

export interface WarehouseWithInventory {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  inventory: {
    productId: string;
    productName: string;
    productPrice: string;
    quantity: number;
  }[];
}

@injectable()
export class WarehouseService {
  constructor(
    @inject(WarehouseRepository) private warehouseRepository: WarehouseRepository
  ) {}

  async getWarehouses(): Promise<WarehouseWithInventory[]> {
    const [warehouses, inventoryRows] = await Promise.all([
      this.warehouseRepository.findMany(),
      this.warehouseRepository.findAllInventoryWithProducts(),
    ]);

    const inventoryByWarehouse = new Map<string, WarehouseWithInventory['inventory']>();
    for (const row of inventoryRows) {
      const list = inventoryByWarehouse.get(row.warehouseId) ?? [];
      list.push({
        productId: row.productId,
        productName: row.productName,
        productPrice: (row.productPrice / 100).toFixed(2),
        quantity: row.quantity,
      });
      inventoryByWarehouse.set(row.warehouseId, list);
    }

    return warehouses.map((w) => ({
      id: w.id,
      name: w.name,
      latitude: w.latitude,
      longitude: w.longitude,
      inventory: inventoryByWarehouse.get(w.id) ?? [],
    }));
  }
}
