import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContainer } from '../lib/in-memory-db';
import { WarehouseRepository } from '../../repositories/warehouse.repository';

describe('WarehouseRepository (integration)', () => {
    let repo: WarehouseRepository;
    let db: Awaited<ReturnType<typeof createTestContainer>>['db'];

    beforeEach(async () => {
        const test = await createTestContainer();
        db = test.db;
        repo = test.container.resolve(WarehouseRepository);
    });

    it('findMany returns empty array when no warehouses', async () => {
        const warehouses = await repo.findMany();
        expect(warehouses).toEqual([]);
    });

    it('findMany returns warehouses ordered by name', async () => {
        const id1 = crypto.randomUUID();
        const id2 = crypto.randomUUID();
        await db
            .insertInto('warehouses')
            .values([
                { id: id1, name: 'Warehouse B', latitude: 40.1, longitude: -74.1 },
                { id: id2, name: 'Warehouse A', latitude: 40.2, longitude: -74.2 },
            ])
            .execute();

        const warehouses = await repo.findMany();
        expect(warehouses).toHaveLength(2);
        expect(warehouses[0]?.name).toBe('Warehouse A');
        expect(warehouses[1]?.name).toBe('Warehouse B');
    });

    it('findAllInventoryWithProducts returns join of inventory and products', async () => {
        const warehouseId = crypto.randomUUID();
        const productId = crypto.randomUUID();
        const inventoryId = crypto.randomUUID();
        await db.insertInto('warehouses').values({
            id: warehouseId,
            name: 'Main',
            latitude: 40.0,
            longitude: -74.0,
        }).execute();
        await db.insertInto('products').values({
            id: productId,
            name: 'Product X',
            price: 500,
        }).execute();
        await db.insertInto('inventory').values({
            id: inventoryId,
            warehouseId,
            productId,
            quantity: 100,
        }).execute();

        const inventory = await repo.findAllInventoryWithProducts();
        expect(inventory).toHaveLength(1);
        expect(inventory[0]).toMatchObject({
            warehouseId,
            productId,
            productName: 'Product X',
            productPrice: 500,
            quantity: 100,
        });
    });
});
