import 'reflect-metadata';
import { container } from 'tsyringe';
import { OrderRepository } from './repositories/order.repository';
import { CustomerRepository } from './repositories/customer.repository';
import { ProductRepository } from './repositories/product.repository';
import { OrderService } from './services/order.service';
import { CustomerService } from './services/customer.service';
import { ProductService } from './services/product.service';
import { OrderController } from './controllers/order.controller';
import { GeocodingService } from './services/geocoding.service';
import { PaymentService } from './services/payment.service';

container.register(OrderRepository, { useClass: OrderRepository });
container.register(CustomerRepository, { useClass: CustomerRepository });
container.register(ProductRepository, { useClass: ProductRepository });
container.register(GeocodingService, { useClass: GeocodingService });
container.register(PaymentService, { useClass: PaymentService });
container.register(OrderService, { useClass: OrderService });
container.register(CustomerService, { useClass: CustomerService });
container.register(ProductService, { useClass: ProductService });
container.register(OrderController, { useClass: OrderController });

export { container };
