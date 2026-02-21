import 'reflect-metadata';
import Fastify from 'fastify';
import { initServer } from '@ts-rest/fastify';
import { contract } from '@repo/contracts';
import { prisma } from '@repo/db';
import { env } from './env';
import { container } from './container';
import { UserController } from './controllers/user.controller';
import { PRISMA_TOKEN } from './lib/prisma';
import { registerErrorHandler } from './lib/error-handler';
import { registerRequestLogger } from './lib/request-logger';
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

function withTransaction(
  ControllerClass: typeof UserController,
  handler: (controller: UserController) => (req: { userId?: string }) => Promise<{ status: number; body: unknown }>
) {
  return async (input: unknown, ...args: unknown[]) => {
    const request = input as { request?: { userId?: string } };
    const userId = request.request?.userId;
    return await prisma.$transaction(async (tx: unknown) => {
      const requestContainer = container.createChildContainer();
      requestContainer.register(PRISMA_TOKEN, { useValue: tx });
      const controller = requestContainer.resolve(ControllerClass) as UserController;
      return handler(controller)({ userId });
    });
  };
}

registerRequestLogger(app);
registerErrorHandler(app);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const router = s.router(contract, {
  getUsers: withTransaction(UserController, (c) => c.getUsers) as any,
  getCurrentUser: withTransaction(UserController, (c) => c.getCurrentUser) as any,
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
