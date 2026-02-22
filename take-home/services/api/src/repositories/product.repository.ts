import { injectable, inject } from 'tsyringe';
import { KYSELY_TOKEN, type KyselyDb } from '../lib/kysely';

export interface ProductRecord {
  id: string;
  name: string;
  price: number;
}

@injectable()
export class ProductRepository {
  constructor(@inject(KYSELY_TOKEN) private db: KyselyDb) {}

  async findMany(): Promise<ProductRecord[]> {
    return this.db
      .selectFrom('products')
      .select(['id', 'name', 'price'])
      .execute();
  }
}
