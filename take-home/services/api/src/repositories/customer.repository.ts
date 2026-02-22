import { injectable, inject } from 'tsyringe';
import { KYSELY_TOKEN, type KyselyDb } from '../lib/kysely';

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
}

@injectable()
export class CustomerRepository {
  constructor(@inject(KYSELY_TOKEN) private db: KyselyDb) {}

  async findMany(): Promise<CustomerRecord[]> {
    return this.db
      .selectFrom('customers')
      .select(['id', 'name', 'email'])
      .execute();
  }
}
