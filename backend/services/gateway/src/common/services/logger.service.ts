import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogContext {
  userId?: string;
  couponId?: string;
  orderId?: string;
  promoCodeId?: string;
  type?: string;
  source?: string;
  [key: string]: any;
}

/**
 * Structured Logger Service for CloudWatch
 * Outputs JSON formatted logs that are easily parsed by CloudWatch Logs Insights
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Log info level message with structured data
   */
  log(message: string, context?: LogContext) {
    this.outputLog('INFO', message, context);
  }

  /**
   * Log error level message with structured data
   */
  error(message: string, trace?: string, context?: LogContext) {
    this.outputLog('ERROR', message, { ...context, trace });
  }

  /**
   * Log warning level message with structured data
   */
  warn(message: string, context?: LogContext) {
    this.outputLog('WARN', message, context);
  }

  /**
   * Log debug level message with structured data
   */
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.outputLog('DEBUG', message, context);
    }
  }

  /**
   * Log verbose level message with structured data
   */
  verbose(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.outputLog('VERBOSE', message, context);
    }
  }

  /**
   * Output structured JSON log
   */
  private outputLog(level: string, message: string, context?: LogContext) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...context,
    };

    // Output as JSON for CloudWatch Logs
    const jsonLog = JSON.stringify(logEntry);

    switch (level) {
      case 'ERROR':
        console.error(jsonLog);
        break;
      case 'WARN':
        console.warn(jsonLog);
        break;
      case 'DEBUG':
      case 'VERBOSE':
        console.debug(jsonLog);
        break;
      default:
        console.log(jsonLog);
    }
  }

  /**
   * Create a child logger with a specific context
   */
  static create(context: string): LoggerService {
    return new LoggerService(context);
  }
}
