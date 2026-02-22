import { injectable, inject } from 'tsyringe';
import { CustomerRepository } from '../repositories/customer.repository';

export interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

@injectable()
export class CustomerService {
  constructor(
    @inject(CustomerRepository) private customerRepository: CustomerRepository
  ) {}

  async getCustomers(): Promise<CustomerOption[]> {
    const customers = await this.customerRepository.findMany();
    return customers;
  }
}
