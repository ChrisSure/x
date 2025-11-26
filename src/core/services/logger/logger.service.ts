import pino from 'pino';
import { execSync } from 'child_process';

/**
 * Logger service using Pino
 * Provides structured logging with environment-based configuration
 */
class LoggerService {
  private logger: pino.Logger;

  constructor() {
    // Set Windows console to UTF-8 encoding if on Windows
    if (process.platform === 'win32') {
      try {
        // Set console output code page to UTF-8 (65001)
        process.stdout.setDefaultEncoding('utf8');
        if (process.stdout.isTTY) {
          // Try to set code page, but don't fail if it doesn't work
          try {
            execSync('chcp 65001 >nul 2>&1', { stdio: 'ignore' });
          } catch {
            // Ignore errors setting code page
          }
        }
      } catch {
        // Ignore errors
      }
    }

    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Use pretty printing in development, JSON in production
    const transport = isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined;

    this.logger = pino({
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      transport,
      // Ensure UTF-8 encoding
      serializers: {
        // Custom serializer to preserve UTF-8 strings
        data: (value: unknown) => {
          if (typeof value === 'string') {
            return value;
          }
          return value;
        },
      },
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
      // If first argument is a string, log message with Pino and write content directly to preserve UTF-8
      // Pino's serialization can corrupt UTF-8 strings on Windows, so we bypass it for string content
      if (args.length === 1 && typeof args[0] === 'string') {
        // Log the message with Pino
        this.logger.debug(message);
        // Write the content directly to stdout to preserve UTF-8 encoding
        // This matches console.log behavior which works correctly
        process.stdout.write(`${args[0]}\n`);
      } else {
        this.logger.debug({ data: args }, message);
      }
    } else {
      this.logger.debug(message);
    }
  }
}

// Export singleton instance
export const logger = new LoggerService();
