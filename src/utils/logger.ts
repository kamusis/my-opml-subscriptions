/**
 * Centralized logging utility for consistent logging across the application
 * Uses Deno's standard logging module for enhanced functionality
 */
import { getLogger, setup, LogLevels, ConsoleHandler, LogRecord } from "@std/log";

export type LogLevel = keyof typeof LogLevels;

// Configure default logging setup
await setup({
  handlers: {
    console: new ConsoleHandler("DEBUG", {
      formatter: (logRecord: LogRecord) => {
        return `${logRecord.levelName} [${logRecord.datetime.toISOString()}] ${logRecord.msg}`;
      }
    })
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"]
    }
  }
});

/**
 * Creates a logger instance for a specific module
 * @param module The module name to be included in log messages
 * @returns A logger object with methods for different log levels
 */
export function createLogger(module: string) {
  const logger = getLogger();
  
  return {
    debug: (...args: unknown[]) => {
      logger.debug(`[${module}] ${args.join(" ")}`);
    },
    info: (...args: unknown[]) => {
      logger.info(`[${module}] ${args.join(" ")}`);
    },
    warn: (...args: unknown[]) => {
      logger.warn(`[${module}] ${args.join(" ")}`);
    },
    error: (...args: unknown[]) => {
      logger.error(`[${module}] ${args.join(" ")}`);
    }
  };
}

/**
 * Set the global log level
 * @param level The log level to set
 */
export function setLogLevel(level: LogLevel) {
  const logger = getLogger();
  logger.level = LogLevels[level];
}
