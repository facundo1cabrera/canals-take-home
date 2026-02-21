import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export function registerRequestLogger(app: FastifyInstance) {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        requestId: request.id,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
      'Incoming request'
    );
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const responseTime = reply.elapsedTime;
    const statusCode = reply.statusCode;

    request.log.info(
      {
        method: request.method,
        url: request.url,
        requestId: request.id,
        statusCode,
        responseTime: `${responseTime.toFixed(2)}ms`,
      },
      'Request completed'
    );
  });
}

