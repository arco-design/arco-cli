import { Level } from 'pino';

export interface IArcoLogger {
  trace(message: string, ...meta: any[]): void;

  debug(message: string, ...meta: any[]): void;

  warn(message: string, ...meta: any[]): void;

  info(message: string, ...meta: any[]): void;

  error(message: string, ...meta: any[]): void;

  fatal(message: string, ...meta: any[]): void;

  console(msg: string): void;

  clearConsole(): void;
}

export { Level as LoggerLevel };
