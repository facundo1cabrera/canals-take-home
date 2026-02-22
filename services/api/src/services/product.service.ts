import { injectable, inject } from 'tsyringe';
import { ProductRepository } from '../repositories/product.repository';

export interface ProductOption {
  id: string;
  name: string;
  price: string;
}

@injectable()
export class ProductService {
  constructor(
    @inject(ProductRepository) private productRepository: ProductRepository
  ) {}

  async getProducts(): Promise<ProductOption[]> {
    const products = await this.productRepository.findMany();
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: (p.price / 100).toFixed(2),
    }));
  }
}
