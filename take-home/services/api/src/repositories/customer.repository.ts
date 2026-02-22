import { injectable, inject } from 'tsyringe';
import { PRISMA_TOKEN, type PrismaTransaction } from '../lib/prisma';

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
}

@injectable()
export class CustomerRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaTransaction) {}

  async findMany(): Promise<CustomerRecord[]> {
    return this.prisma.customer.findMany({
      select: { id: true, name: true, email: true },
    });
  }
}
