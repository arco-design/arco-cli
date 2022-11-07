import pino, { Logger as PinoLogger } from 'pino';
import { PATH_DEBUG_LOGS } from '../constants';

export default function getPinoLogger(
  logLevel: string,
  jsonFormat: boolean
): { pinoLogger: PinoLogger; pinoLoggerConsole: PinoLogger } {
  // https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
  const PinoLevelToSeverityLookup = {
    trace: 'DEBUG',
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARNING',
    error: 'ERROR',
    fatal: 'CRITICAL',
  };

  const formatters = {
    level(label: string, number: number) {
      return {
        severity: PinoLevelToSeverityLookup[label] || PinoLevelToSeverityLookup.info,
        level: number,
      };
    },
  };

  /**
   * by default, Pino expects the first parameter to be an object and the second to be the message
   * string. since all current log messages were written using Winston, they're flipped - message
   * first and then other data.
   * this hook flips the first two arguments, so then it's fine to have the message as the first arg.
   */
  const hooks = {
    logMethod(inputArgs, method) {
      if (inputArgs.length >= 2 && inputArgs[1] !== undefined) {
        const arg1 = inputArgs.shift();
        const arg2 = inputArgs.shift();
        return method.apply(this, [arg2, arg1]);
      }
      return method.apply(this, inputArgs);
    },
  };

  const pinoLogger: PinoLogger = pino({
    hooks,
    formatters,
    transport: jsonFormat
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'hostname',
            destination: PATH_DEBUG_LOGS,
            sync: true,
          },
        },
  });
  pinoLogger.level = logLevel;

  const pinoLoggerConsole = pino({
    hooks,
    formatters,
    transport: jsonFormat
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'hostname,pid,time,level',
          },
        },
  });
  pinoLoggerConsole.level = logLevel;

  return { pinoLogger, pinoLoggerConsole };
}
