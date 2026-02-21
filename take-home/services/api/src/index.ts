import 'reflect-metadata';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initServer } from '@ts-rest/fastify';
import { contract } from '@repo/contracts';
import { prisma } from '@repo/db';
import { env } from './env';
import { container } from './container';
import { OrderController } from './controllers/order.controller';
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

function withOrderTransaction(
  ControllerClass: typeof OrderController,
  handler: (controller: OrderController) => (body: unknown) => Promise<{ status: number; body: unknown }>
) {
  return async (input: unknown) => {
    const request = input as { body?: unknown };
    return await prisma.$transaction(async (tx: unknown) => {
      const requestContainer = container.createChildContainer();
      requestContainer.register(PRISMA_TOKEN, { useValue: tx });
      const controller = requestContainer.resolve(ControllerClass) as OrderController;
      return handler(controller)(request.body ?? {});
    });
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const router = s.router(contract, {
  getCustomers: async () => {
    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, email: true },
    });
    return { status: 200, body: customers };
  },
  getProducts: async () => {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, price: true },
    });
    return {
      status: 200,
      body: products.map((p) => ({ id: p.id, name: p.name, price: (p.price / 100).toFixed(2) })),
    };
  },
  getOrders: async () => {
    const controller = container.resolve(OrderController);
    return controller.getOrders();
  },
  createOrder: withOrderTransaction(OrderController, (c) => c.createOrder) as any,
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
