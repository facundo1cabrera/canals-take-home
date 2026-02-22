import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContainer } from '../lib/in-memory-db';
import { CustomerRepository } from '../../repositories/customer.repository';

describe('CustomerRepository (integration)', () => {
    let repo: CustomerRepository;
    let db: Awaited<ReturnType<typeof createTestContainer>>['db'];

    beforeEach(async () => {
        const test = await createTestContainer();
        db = test.db;
        repo = test.container.resolve(CustomerRepository);
    });

    it('findMany returns empty array when no customers', async () => {
        const customers = await repo.findMany();
        expect(customers).toEqual([]);
    });

    it('findMany returns inserted customers', async () => {
        const id1 = crypto.randomUUID();
        const id2 = crypto.randomUUID();
        await db
            .insertInto('customers')
            .values([
                { id: id1, name: 'Alice', email: 'alice@example.com' },
                { id: id2, name: 'Bob', email: 'bob@example.com' },
            ])
            .execute();

        const customers = await repo.findMany();
        expect(customers).toHaveLength(2);
        expect(customers.map((c) => c.name).sort()).toEqual(['Alice', 'Bob']);
        expect(customers.find((c) => c.email === 'alice@example.com')).toEqual({
            id: id1,
            name: 'Alice',
            email: 'alice@example.com',
        });
    });
});
