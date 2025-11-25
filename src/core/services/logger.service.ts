import pino from 'pino';

/**
 * Logger service using Pino
 * Provides structured logging with environment-based configuration
 */
class LoggerService {
  private logger: pino.Logger;

  constructor() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Use pretty printing in development, JSON in production
    const transport = isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined;

    this.logger = pino({
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      transport,
    });
  }

  /**
   * Log info level message
   */
  info(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      this.logger.info({ data: args }, message);
    } else {
      this.logger.info(message);
    }
  }

  /**
   * Log error level message
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (error instanceof Error) {
      this.logger.error({ err: error, data: args }, message);
    } else if (error !== undefined) {
      this.logger.error({ data: [error, ...args] }, message);
    } else if (args.length > 0) {
      this.logger.error({ data: args }, message);
    } else {
      this.logger.error(message);
    }
  }

  /**
   * Log warn level message
   */
  warn(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      this.logger.warn({ data: args }, message);
    } else {
      this.logger.warn(message);
    }
  }

  /**
   * Log debug level message
   */
  debug(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      this.logger.debug({ data: args }, message);
    } else {
      this.logger.debug(message);
    }
  }
}

// Export singleton instance
export const logger = new LoggerService();
