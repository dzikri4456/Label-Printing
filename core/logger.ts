/**
 * Enhanced Logger with Structured Logging
 * 
 * Provides consistent, structured logging with log levels, context, and
 * optional integration with external logging services.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  action: string;
  context?: LogContext;
  error?: Error;
}

class LoggerService {
  private minLevel: LogLevel;
  private enableConsole: boolean;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor() {
    this.minLevel = this.getMinLogLevel();
    this.enableConsole = true;
  }

  private getMinLogLevel(): LogLevel {
    const env = (import.meta as any).env?.MODE || 'development';
    return env === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(entry: LogEntry): string {
    return `[${entry.level}] [${entry.timestamp}] [${entry.action}]`;
  }

  private createLogEntry(
    level: LogLevel,
    action: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      action,
      context,
      error,
    };
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    this.addToBuffer(entry);

    if (!this.enableConsole) return;

    const message = this.formatMessage(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.log(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.context || '');
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  debug(action: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, action, context));
  }

  info(action: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.INFO, action, context));
  }

  warn(action: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.WARN, action, context));
  }

  error(action: string, error: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(this.createLogEntry(LogLevel.ERROR, action, context, errorObj));
  }

  /**
   * Get recent log entries (useful for debugging or error reporting)
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Disable console output (useful for testing)
   */
  disableConsole(): void {
    this.enableConsole = false;
  }

  /**
   * Enable console output
   */
  enableConsoleOutput(): void {
    this.enableConsole = true;
  }
}

export const Logger = new LoggerService();

// Export for testing
export { LoggerService };