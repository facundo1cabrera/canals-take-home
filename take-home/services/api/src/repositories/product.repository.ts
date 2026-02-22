import { injectable, inject } from 'tsyringe';
import { PRISMA_TOKEN, type PrismaTransaction } from '../lib/prisma';

export interface ProductRecord {
  id: string;
  name: string;
  price: number;
}

@injectable()
export class ProductRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaTransaction) {}

  async findMany(): Promise<ProductRecord[]> {
    return this.prisma.product.findMany({
      select: { id: true, name: true, price: true },
    });
  }
}
