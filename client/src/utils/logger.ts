interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  private level: number;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.level = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
  }

  private shouldLog(level: number): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [${level}] ${message}`;
      console.log(formattedMessage, ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      if (this.isDevelopment) {
        console.error(`[ERROR] ${message}`, error, ...args);
      } else {
        // In production, you would send to error tracking service
        // Example: Sentry.captureException(error, { extra: { message, ...args } });
      }
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      this.formatMessage('WARN', message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      this.formatMessage('INFO', message, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      this.formatMessage('DEBUG', message, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger };