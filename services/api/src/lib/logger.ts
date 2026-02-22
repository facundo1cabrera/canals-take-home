import type { FastifyBaseLogger } from 'fastify';

export interface Logger {
  info: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  debug: (obj: unknown, msg?: string) => void;
  trace: (obj: unknown, msg?: string) => void;
  fatal: (obj: unknown, msg?: string) => void;
}

export class AppLogger {
  constructor(private logger: FastifyBaseLogger) {}

  info(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      this.logger.info(meta, message);
    } else {
      this.logger.info(message);
    }
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
    const logData = {
      ...meta,
      ...(error instanceof Error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      } : {}),
      ...(error && !(error instanceof Error) ? { error } : {}),
    };

    this.logger.error(logData, message);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      this.logger.warn(meta, message);
    } else {
      this.logger.warn(message);
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      this.logger.debug(meta, message);
    } else {
      this.logger.debug(message);
    }
  }

  trace(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      this.logger.trace(meta, message);
    } else {
      this.logger.trace(message);
    }
  }

  fatal(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      this.logger.fatal(meta, message);
    } else {
      this.logger.fatal(message);
    }
  }

  child(bindings: Record<string, unknown>) {
    return new AppLogger(this.logger.child(bindings));
  }
}

