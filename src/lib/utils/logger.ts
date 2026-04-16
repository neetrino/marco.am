/**
 * Logger utility for consistent logging across the application
 * Replaces console.log with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment()) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment()) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }

  log(message: string, context?: LogContext): void {
    // Alias for info in development
    this.info(message, context);
  }

  /**
   * Development-only multi-arg passthrough (replaces scattered console.log).
   */
  devLog(...args: unknown[]): void {
    if (!this.isDevelopment()) return;
    console.log(...args);
  }

  /**
   * Development-only passthrough for console.info-style messages.
   */
  devInfo(...args: unknown[]): void {
    if (!this.isDevelopment()) return;
    console.info(...args);
  }

  /**
   * Development-only passthrough for console.debug-style messages.
   */
  devDebug(...args: unknown[]): void {
    if (!this.isDevelopment()) return;
    console.debug(...args);
  }

  /**
   * Logs in all environments (e.g. service lifecycle / Redis ready).
   */
  alwaysInfo(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }
}

export const logger = new Logger();



