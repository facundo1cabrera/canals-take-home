import 'reflect-metadata';
import type { DependencyContainer } from 'tsyringe';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { ServerInferRequest, ServerInferResponses } from '@ts-rest/core';
import { initServer } from '@ts-rest/fastify';
import { contract } from '@repo/contracts';
import { prisma } from '@repo/db';
import { env } from './env';
import { container } from './container';
import { OrderController } from './controllers/order.controller';
import { CustomerService } from './services/customer.service';
import { ProductService } from './services/product.service';
import { PRISMA_TOKEN } from './lib/prisma';
import { registerErrorHandler } from './lib/error-handler';
import { registerRequestLogger } from './lib/request-logger';

container.register(PRISMA_TOKEN, { useValue: prisma });

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    transport:
      env.NODE_ENV === 'development'
        ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
        : undefined,
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  disableRequestLogging: true,
  genReqId: () => crypto.randomUUID(),
});

const s = initServer();

await app.register(cors, { origin: true });
registerRequestLogger(app);
registerErrorHandler(app);

/**
 * Wraps a handler in a Prisma transaction. The handler receives the request and a
 * request-scoped container where PRISMA_TOKEN is bound to the transaction client,
 * so all resolved services/repositories share the same transaction.
 */
function withTransaction<TReq, TRes>(
  handler: (req: TReq, requestContainer: DependencyContainer) => Promise<TRes>
) {
  return async (req: TReq): Promise<TRes> => {
    return prisma.$transaction(async (tx: unknown) => {
      const requestContainer = container.createChildContainer();
      requestContainer.register(PRISMA_TOKEN, { useValue: tx });
      return handler(req, requestContainer);
    });
  };
}

const router = s.router(contract, {
  getCustomers: withTransaction(async (_req, requestContainer) => {
    const customerService = requestContainer.resolve(CustomerService);
    const customers = await customerService.getCustomers();
    return { status: 200, body: customers };
  }),

  getProducts: withTransaction(async (_req, requestContainer) => {
    const productService = requestContainer.resolve(ProductService);
    const products = await productService.getProducts();
    return { status: 200, body: products };
  }),

  getOrders: withTransaction(async (_req, requestContainer) => {
    const controller = requestContainer.resolve(OrderController);
    return controller.getOrders();
  }),

  createOrder: withTransaction<ServerInferRequest<typeof contract.createOrder>,ServerInferResponses<typeof contract.createOrder>>(async (req, requestContainer) => {
    const controller = requestContainer.resolve(OrderController);
    return controller.createOrder(req.body);
  }),
});

const start = async () => {
  try {
    app.register(s.plugin(router));
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
