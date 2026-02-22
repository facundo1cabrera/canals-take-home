import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContainer } from '../lib/in-memory-db';
import { ProductRepository } from '../../repositories/product.repository';

describe('ProductRepository (integration)', () => {
    let repo: ProductRepository;
    let db: Awaited<ReturnType<typeof createTestContainer>>['db'];

    beforeEach(async () => {
        const test = await createTestContainer();
        db = test.db;
        repo = test.container.resolve(ProductRepository);
    });

    it('findMany returns empty array when no products', async () => {
        const products = await repo.findMany();
        expect(products).toEqual([]);
    });

    it('findMany returns inserted products', async () => {
        const id1 = crypto.randomUUID();
        const id2 = crypto.randomUUID();
        await db
            .insertInto('products')
            .values([
                { id: id1, name: 'Widget', price: 1000 },
                { id: id2, name: 'Gadget', price: 2500 },
            ])
            .execute();

        const products = await repo.findMany();

        expect(products).toHaveLength(2);
        expect(products.map((p) => p.name).sort()).toEqual(['Gadget', 'Widget']);
        expect(products.find((p) => p.name === 'Widget')).toEqual({
            id: id1,
            name: 'Widget',
            price: 1000,
        });
    });
});
