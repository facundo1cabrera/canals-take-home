import { injectable, inject } from 'tsyringe';
import { PRISMA_TOKEN, type PrismaTransaction } from '../lib/prisma';

@injectable()
export class UserRepository {
  constructor(@inject(PRISMA_TOKEN) private prisma: PrismaTransaction) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
