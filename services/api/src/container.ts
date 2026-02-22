import 'reflect-metadata';
import { container } from 'tsyringe';
import { OrderRepository } from './repositories/order.repository';
import { CustomerRepository } from './repositories/customer.repository';
import { ProductRepository } from './repositories/product.repository';
import { OrderService } from './services/order.service';
import { CustomerService } from './services/customer.service';
import { ProductService } from './services/product.service';
import { OrderController } from './controllers/order.controller';
import { WarehouseController } from './controllers/warehouse.controller';
import { GeocodingService } from './services/geocoding.service';
import { PaymentService } from './services/payment.service';
import { WarehouseService } from './services/warehouse.service';
import { WarehouseRepository } from './repositories/warehouse.repository';

container.register(OrderRepository, { useClass: OrderRepository });
container.register(CustomerRepository, { useClass: CustomerRepository });
container.register(ProductRepository, { useClass: ProductRepository });
container.register(GeocodingService, { useClass: GeocodingService });
container.register(PaymentService, { useClass: PaymentService });
container.register(OrderService, { useClass: OrderService });
container.register(CustomerService, { useClass: CustomerService });
container.register(ProductService, { useClass: ProductService });
container.register(OrderController, { useClass: OrderController });
container.register(WarehouseRepository, { useClass: WarehouseRepository });
container.register(WarehouseService, { useClass: WarehouseService });
container.register(WarehouseController, { useClass: WarehouseController });

export { container };
