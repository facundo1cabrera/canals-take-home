import { injectable, inject } from 'tsyringe';
import { WarehouseService } from '../services/warehouse.service';
import type { ServerInferResponses } from '@ts-rest/core';
import { contract } from '@repo/contracts';

type GetWarehousesResponse = ServerInferResponses<typeof contract.getWarehouses>;

@injectable()
export class WarehouseController {
  constructor(@inject(WarehouseService) private warehouseService: WarehouseService) {}

  getWarehouses = async (): Promise<GetWarehousesResponse> => {
    const warehouses = await this.warehouseService.getWarehouses();
    return { status: 200, body: warehouses };
  };
}
