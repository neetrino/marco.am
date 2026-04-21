/**
 * Logger utility for consistent logging across the application
 * Replaces console.log with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

function toContext(rest: unknown[]): LogContext | undefined {
  if (rest.length === 0) return undefined;
  if (rest.length === 1) {
    const only = rest[0];
    if (only !== null && typeof only === 'object' && !Array.isArray(only)) {
      return only as LogContext;
    }
    return { value: only };
  }
  return { args: rest };
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

  debug(message: string, ...rest: unknown[]): void {
    if (this.isDevelopment()) {
      const context = toContext(rest);
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, ...rest: unknown[]): void {
    if (this.isDevelopment()) {
      const context = toContext(rest);
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, ...rest: unknown[]): void {
    const context = toContext(rest);
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, ...rest: unknown[]): void {
    const context = toContext(rest);
    console.error(this.formatMessage('error', message, context));
  }

  log(message: string, ...rest: unknown[]): void {
    this.info(message, ...rest);
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
   * Development-only passthrough for console.warn-style messages.
   */
  devWarn(...args: unknown[]): void {
    if (!this.isDevelopment()) return;
    console.warn(...args);
  }

  /**
   * Development-only passthrough for console.error-style messages.
   */
  devError(...args: unknown[]): void {
    if (!this.isDevelopment()) return;
    console.error(...args);
  }

  /**
   * Logs in all environments (e.g. service lifecycle / Redis ready).
   */
  alwaysInfo(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }
}

export const logger = new Logger();
