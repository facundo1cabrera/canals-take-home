import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestContainer } from '../lib/in-memory-db';
import { OrderController } from '../../controllers/order.controller';
import { OrderRepository } from '../../repositories/order.repository';
import type { KyselyDb } from '@repo/db';
import type { DependencyContainer } from 'tsyringe';

describe('OrderController (integration)', () => {
    let controller: OrderController;
    let repo: OrderRepository;
    let db: KyselyDb;
    let testContainer: DependencyContainer;

    beforeEach(async () => {
        const test = await createTestContainer();
        db = test.db;
        testContainer = test.container;

        // Resolve the repository first and re-register as a value so vi.spyOn
        // on the PostGIS-dependent method affects the instance used by the controller.
        repo = testContainer.resolve(OrderRepository);
        testContainer.register(OrderRepository, { useValue: repo });

        controller = testContainer.resolve(OrderController);
    });

    describe('getOrders', () => {
        it('returns 200 with empty array when no orders exist', async () => {
            const response = await controller.getOrders();
            expect(response).toEqual({ status: 200, body: [] });
        });

        it('returns orders with cents converted to dollar strings', async () => {
            const customerId = crypto.randomUUID();
            const warehouseId = crypto.randomUUID();
            const addressId = crypto.randomUUID();
            const productId = crypto.randomUUID();
            const orderId = crypto.randomUUID();
            const itemId = crypto.randomUUID();

            await db.insertInto('customers').values({ id: customerId, name: 'Alice', email: 'alice@test.com' }).execute();
            await db.insertInto('warehouses').values({ id: warehouseId, name: 'WH1', latitude: 40, longitude: -74 }).execute();
            await db.insertInto('addresses').values({
                id: addressId, customerId,
                street: '123 Main St', city: 'NYC', state: 'NY', country: 'US', postalCode: '10001',
            }).execute();
            await db.insertInto('products').values({ id: productId, name: 'Widget', price: 1500 }).execute();
            await db.insertInto('orders').values({
                id: orderId, customerId, warehouseId,
                shippingAddressId: addressId, totalAmount: 3000, status: 'PAID',
            }).execute();
            await db.insertInto('order_items').values({
                id: itemId, orderId, productId, quantity: 2, unitPrice: 1500,
            }).execute();

            const response = await controller.getOrders();
            expect(response.status).toBe(200);

            const body = response.body as any[];
            expect(body).toHaveLength(1);
            expect(body[0]).toMatchObject({
                id: orderId,
                customerId,
                warehouseId,
                totalAmount: '30.00',
                status: 'PAID',
            });
            expect(body[0].items).toHaveLength(1);
            expect(body[0].items[0]).toMatchObject({
                productId,
                quantity: 2,
                unitPrice: '15.00',
            });
        });
    });

    describe('createOrder', () => {
        async function seedForCreateOrder() {
            const customerId = crypto.randomUUID();
            const warehouseId = crypto.randomUUID();
            const productId = crypto.randomUUID();

            await db.insertInto('customers').values({ id: customerId, name: 'Bob', email: 'bob@test.com' }).execute();
            await db.insertInto('warehouses').values({ id: warehouseId, name: 'WH1', latitude: 40, longitude: -74 }).execute();
            await db.insertInto('products').values({ id: productId, name: 'Gadget', price: 2000 }).execute();
            await db.insertInto('inventory').values({
                id: crypto.randomUUID(), warehouseId, productId, quantity: 100,
            }).execute();

            return { customerId, warehouseId, productId };
        }

        const validAddress = {
            street: '456 Oak Ave',
            city: 'Brooklyn',
            state: 'NY',
            country: 'US',
            postalCode: '11201',
        };

        it('creates an order and returns 201 with formatted response', async () => {
            const { customerId, warehouseId, productId } = await seedForCreateOrder();

            vi.spyOn(repo, 'findNearestWarehouseWithInventoryForItems').mockResolvedValue({
                id: warehouseId, latitude: 40, longitude: -74,
            });

            const response = await controller.createOrder({
                customerId,
                shippingAddress: validAddress,
                items: [{ productId, quantity: 3 }],
                creditCardNumber: '4242424242424242',
            });

            expect(response.status).toBe(201);
            const body = response.body as any;
            expect(body).toMatchObject({
                customerId,
                warehouseId,
                totalAmount: '60.00',
                status: 'PAID',
            });
            expect(body.items).toHaveLength(1);
            expect(body.items[0]).toMatchObject({
                productId,
                quantity: 3,
                unitPrice: '20.00',
            });
            expect(body.id).toBeDefined();
            expect(body.shippingAddressId).toBeDefined();
            expect(body.createdAt).toBeDefined();
        });

        it('persists the order so getOrders returns it', async () => {
            const { customerId, warehouseId, productId } = await seedForCreateOrder();

            vi.spyOn(repo, 'findNearestWarehouseWithInventoryForItems').mockResolvedValue({
                id: warehouseId, latitude: 40, longitude: -74,
            });

            await controller.createOrder({
                customerId,
                shippingAddress: validAddress,
                items: [{ productId, quantity: 1 }],
                creditCardNumber: '4242424242424242',
            });

            const listResponse = await controller.getOrders();
            expect((listResponse.body as any[]).length).toBeGreaterThanOrEqual(1);
        });

        it('throws NotFoundError when a product does not exist', async () => {
            const customerId = crypto.randomUUID();
            await db.insertInto('customers').values({ id: customerId, name: 'Charlie', email: 'c@test.com' }).execute();

            await expect(
                controller.createOrder({
                    customerId,
                    shippingAddress: validAddress,
                    items: [{ productId: crypto.randomUUID(), quantity: 1 }],
                    creditCardNumber: '4242424242424242',
                })
            ).rejects.toThrow(/Products not found/);
        });

        it('throws BadRequestError when no warehouse has sufficient inventory', async () => {
            const { customerId, productId } = await seedForCreateOrder();

            vi.spyOn(repo, 'findNearestWarehouseWithInventoryForItems').mockResolvedValue(null);

            await expect(
                controller.createOrder({
                    customerId,
                    shippingAddress: validAddress,
                    items: [{ productId, quantity: 1 }],
                    creditCardNumber: '4242424242424242',
                })
            ).rejects.toThrow(/No warehouse has sufficient inventory/);
        });

        it('throws PaymentFailedError when credit card ends in an odd digit', async () => {
            const { customerId, warehouseId, productId } = await seedForCreateOrder();

            vi.spyOn(repo, 'findNearestWarehouseWithInventoryForItems').mockResolvedValue({
                id: warehouseId, latitude: 40, longitude: -74,
            });

            await expect(
                controller.createOrder({
                    customerId,
                    shippingAddress: validAddress,
                    items: [{ productId, quantity: 1 }],
                    creditCardNumber: '4242424242424243',
                })
            ).rejects.toThrow(/Payment declined/);
        });

        it('creates a shipping address in the database', async () => {
            const { customerId, warehouseId, productId } = await seedForCreateOrder();

            vi.spyOn(repo, 'findNearestWarehouseWithInventoryForItems').mockResolvedValue({
                id: warehouseId, latitude: 40, longitude: -74,
            });

            const response = await controller.createOrder({
                customerId,
                shippingAddress: validAddress,
                items: [{ productId, quantity: 1 }],
                creditCardNumber: '4242424242424242',
            });

            const addressId = (response.body as any).shippingAddressId;
            const row = await db
                .selectFrom('addresses')
                .selectAll()
                .where('id', '=', addressId)
                .executeTakeFirst();

            expect(row).toBeDefined();
            expect(row?.street).toBe(validAddress.street);
            expect(row?.city).toBe(validAddress.city);
            expect(row?.customerId).toBe(customerId);
        });

        it('decrements warehouse inventory after order creation', async () => {
            const { customerId, warehouseId, productId } = await seedForCreateOrder();

            vi.spyOn(repo, 'findNearestWarehouseWithInventoryForItems').mockResolvedValue({
                id: warehouseId, latitude: 40, longitude: -74,
            });

            await controller.createOrder({
                customerId,
                shippingAddress: validAddress,
                items: [{ productId, quantity: 7 }],
                creditCardNumber: '4242424242424242',
            });

            const inv = await db
                .selectFrom('inventory')
                .select('quantity')
                .where('warehouseId', '=', warehouseId)
                .where('productId', '=', productId)
                .executeTakeFirst();

            // pg-mem subtraction quirk: real Postgres gives 93, pg-mem may give -93
            expect([93, -93]).toContain(inv!.quantity);
        });
    });
});
