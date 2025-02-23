import { LogLevel } from "./types";

import type { LogEntry, LoggerConfig, LogWriter } from "./types";

export class Logger {
  private config: Omit<Required<LoggerConfig>, "logWriter">;
  private logWriter?: LogWriter;

  constructor(config: LoggerConfig) {
    this.config = {
      level: config.level,
      enableTimestamp: config.enableTimestamp ?? true,
      enableColors: config.enableColors ?? true,
      logToFile: config.logToFile ?? false,
      logPath: config.logPath ?? "./logs",
    };

    if (this.config.logToFile && !config.logWriter) {
      throw new Error("LogWriter must be provided when logToFile is enabled");
    }

    if (config.logWriter) {
      this.logWriter = config.logWriter;
    }
  }

  error(context: string, message: string, data?: any) {
    this.log(LogLevel.ERROR, context, message, data);
    console.error(data);
  }

  warn(context: string, message: string, data?: any) {
    this.log(LogLevel.WARN, context, message, data);
  }

  info(context: string, message: string, data?: any) {
    this.log(LogLevel.INFO, context, message, data);
  }

  debug(context: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  trace(context: string, message: string, data?: any) {
    this.log(LogLevel.TRACE, context, message, data);
  }

  private log(level: LogLevel, context: string, message: string, data?: any) {
    if (level > this.config.level) return;

    const entry: LogEntry = {
      level,
      timestamp: new Date(),
      context,
      message,
      data,
    };

    const formatted = this.formatLogEntry(entry);

    if (this.config.enableColors) {
      console.log(this.colorize(formatted, level));
    } else {
      console.log(formatted);
    }

    if (this.config.logToFile) {
      this.writeToFile(entry);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.config.enableTimestamp) {
      parts.push(`[${entry.timestamp.toISOString()}]`);
    }

    parts.push(`[${LogLevel[entry.level]}]`);
    parts.push(`[${entry.context}]`);
    parts.push(entry.message);

    if (entry.data) {
      parts.push(JSON.stringify(entry.data, null, 2));
    }

    return parts.join(" ");
  }

  private colorize(message: string, level: LogLevel): string {
    const colors = {
      [LogLevel.ERROR]: "\x1b[31m", // Red
      [LogLevel.WARN]: "\x1b[33m", // Yellow
      [LogLevel.INFO]: "\x1b[36m", // Cyan
      [LogLevel.DEBUG]: "\x1b[32m", // Green
      [LogLevel.TRACE]: "\x1b[90m", // Gray
    };

    const reset = "\x1b[0m";
    return `${colors[level]}${message}${reset}`;
  }

  private initLogFile() {
    if (!this.logWriter) {
      throw new Error("LogWriter not configured");
    }
    this.logWriter.init(this.config.logPath);
  }

  private writeToFile(entry: LogEntry) {
    if (!this.logWriter) {
      throw new Error("LogWriter not configured");
    }

    const logLine = this.formatLogEntry(entry) + "\n";
    this.logWriter.write(logLine);
  }
}
