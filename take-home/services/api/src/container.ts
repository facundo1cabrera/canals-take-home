import 'reflect-metadata';
import { container } from 'tsyringe';
import { OrderRepository } from './repositories/order.repository';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';
import { GeocodingService } from './services/geocoding.service';
import { PaymentService } from './services/payment.service';

container.register(OrderRepository, { useClass: OrderRepository });
container.register(GeocodingService, { useClass: GeocodingService });
container.register(PaymentService, { useClass: PaymentService });
container.register(OrderService, { useClass: OrderService });
container.register(OrderController, { useClass: OrderController });

export { container };
