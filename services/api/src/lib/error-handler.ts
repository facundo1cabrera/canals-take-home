import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ApiError } from './errors'  ;
import { env } from '../env';
import { ZodError } from 'zod';

interface ErrorResponse {
  error: {
    name: string;
    message: string;
    statusCode: number;
    code?: string;
    details?: unknown;
    stack?: string;
  };
  timestamp: string;
  path: string;
  requestId?: string;
}

function formatErrorResponse(
  error: Error,
  statusCode: number,
  request: FastifyRequest,
  code?: string,
  details?: unknown
): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      name: error.name,
      message: error.message,
      statusCode,
      code,
      details,
    },
    timestamp: new Date().toISOString(),
    path: request.url,
    requestId: request.id,
  };

  if (env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const logger = request.log;

    if (error instanceof ApiError) {
      logger.warn(
        {
          error: {
            name: error.name,
            message: error.message,
            statusCode: error.statusCode,
            code: error.code,
          },
          url: request.url,
          method: request.method,
        },
        `API Error: ${error.message}`
      );

      const response = formatErrorResponse(
        error,
        error.statusCode,
        request,
        error.code,
        error.details
      );

      return reply.status(error.statusCode).send(response);
    }

    if (error instanceof ZodError) {
      logger.warn(
        {
          error: error,
          url: request.url,
          method: request.method,
        },
        'Validation Error'
      );

      const response = formatErrorResponse(
        error,
        422,
        request,
        'VALIDATION_ERROR',
        error
      );

      return reply.status(422).send(response);
    }

    if ('statusCode' in error) {
      const statusCode = error.statusCode || 500;
      
      if (statusCode >= 500) {
        logger.error(
          {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            url: request.url,
            method: request.method,
          },
          `Server Error: ${error.message}`
        );
      } else {
        logger.warn(
          {
            error: {
              name: error.name,
              message: error.message,
            },
            url: request.url,
            method: request.method,
          },
          `Client Error: ${error.message}`
        );
      }

      const response = formatErrorResponse(
        error,
        statusCode,
        request,
        'code' in error ? String(error.code) : undefined
      );

      return reply.status(statusCode).send(response);
    }

    logger.error(
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        url: request.url,
        method: request.method,
      },
      `Unexpected Error: ${error.message}`
    );

    const response = formatErrorResponse(
      error,
      500,
      request,
      'INTERNAL_SERVER_ERROR'
    );

    return reply.status(500).send(response);
  });

  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    request.log.warn(
      {
        url: request.url,
        method: request.method,
      },
      'Route not found'
    );

    const response: ErrorResponse = {
      error: {
        name: 'NotFoundError',
        message: `Route ${request.method} ${request.url} not found`,
        statusCode: 404,
        code: 'NOT_FOUND',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.id,
    };

    reply.status(404).send(response);
  });
}

