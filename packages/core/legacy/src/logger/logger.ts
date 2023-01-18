import yn from 'yn';
import chalk from 'chalk';
import format from 'string-format';
import { Logger as PinoLogger, Level } from 'pino';
// import { serializeError } from 'serialize-error';
// import { Analytics } from '../analytics/analytics';
import { getSync } from '../globalConfig';
import defaultHandleError from '../cli/defaultErrorHandler';
import { CFG_LOG_JSON_FORMAT, CFG_LOG_LEVEL } from '../constants';
import { Profiler } from './profiler';
import getPinoLogger from './getPinoLogger';
import { IArcoLogger } from './interface';

const LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

function isLevel(maybeLevel: Level | string): maybeLevel is Level {
  return LEVELS.includes(maybeLevel);
}

function getLogLevel(): Level {
  const defaultLevel = 'debug';
  const level = getSync(CFG_LOG_LEVEL) || defaultLevel;
  if (isLevel(level)) return level;
  const levelsStr = LEVELS.join(', ');
  console.error(
    `fatal: level "${level}" coming from ${CFG_LOG_LEVEL} configuration is invalid. permitted levels are: ${levelsStr}`
  );
  return defaultLevel;
}

// function addBreadCrumb(category: string, message: string, data: Record<string, any>, extraData) {
//   data = data || {};
//   const hashedData = {};
//   Object.keys(data).forEach((key) => {
//     hashedData[key] = Analytics.hashData(data[key]);
//   });
//   const messageWithHashedData = format(message, hashedData);
//   extraData = extraData instanceof Error ? serializeError(extraData) : extraData;
//   Analytics.addBreadCrumb(category, messageWithHashedData, extraData);
// }

const logLevel = getLogLevel();
const jsonFormat =
  yn(getSync(CFG_LOG_JSON_FORMAT), { default: false }) ||
  yn(process.env.JSON_LOGS, { default: false });

const { pinoLogger, pinoLoggerConsole } = getPinoLogger(logLevel, jsonFormat);

/**
 * the method signatures of debug/info/error/etc are similar to Winston.logger.
 * the way how it is formatted in the log file is according to the `customPrint` function above.
 *
 * Note about logging Error objects (with stacktrace).
 * when throwing an error in the code, it shows it formatted nicely in the log. and also in the console when
 * ARCO_LOG is used.
 * when using logger.error(error), it shows undefined, because it expects a message as the first parameter.
 * when using logger.error(message, error), it shows the error serialized and unclear.
 * normally, no need to call logger.error(). once an error is thrown, it is already logged.
 */
class ArcoLogger implements IArcoLogger {
  private profiler: Profiler;

  logger: PinoLogger;

  /**
   * CLI is a daemon as it should never exit the process, unless the user kills it
   */
  isDaemon = false;

  /**
   * being set on command-registrar, once the flags are parsed. here, it's a workaround to have
   * it set before the command-registrar is loaded. at this stage we don't know for sure the "-j"
   * is actually "json". that's why this variable is overridden once the command-registrar is up.
   */
  shouldWriteToConsole = !process.argv.includes('--json') && !process.argv.includes('-j');

  constructor(logger: PinoLogger) {
    this.logger = logger;
    this.profiler = new Profiler();
  }

  trace(message: string, ...meta: any[]) {
    this.logger.trace(message, ...meta);
  }

  debug(message: string, ...meta: any[]) {
    this.logger.debug(message, ...meta);
  }

  warn(message: string, ...meta: any[]) {
    this.logger.warn(message, ...meta);
  }

  info(message: string, ...meta: any[]) {
    this.logger.info(message, ...meta);
  }

  error(message: string, ...meta: any[]) {
    this.logger.error(message, ...meta);
  }

  fatal(message: string, ...meta: any[]) {
    this.logger.fatal(message, ...meta);
  }

  get isJsonFormat() {
    return jsonFormat;
  }

  /**
   * use this instead of calling `console.log()`, this way it won't break commands that don't
   * expect output during the execution.
   */
  console(msg?: string | Error, level?: Level, color?: string) {
    level = level || 'info';
    if (!msg) return;

    let messageStr: string;
    if (msg instanceof Error) {
      const { message } = defaultHandleError(msg);
      messageStr = message;
    } else {
      messageStr = msg;
    }

    if (!this.shouldWriteToConsole) {
      this[level](messageStr);
      return;
    }

    if (color) {
      try {
        messageStr = chalk[color](messageStr);
      } catch (err) {
        this.trace('a wrong color provided to logger.console method');
      }
    }
    pinoLoggerConsole[level](messageStr);
  }

  clearConsole() {
    process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
  }

  /**
   * useful to get an idea how long it takes from one point in the code to another point.
   * to use it, choose an id and call `logger.profile(your-id)` before and after the code you want
   * to measure. e.g.
   * ```
   * logger.profile('loadingComponent');
   * consumer.loadComponent(id);
   * logger.profile('loadingComponent');
   * ```
   * once done, the log writes the time it took to execute the code between the two calls.
   * if this is a repeated code it also shows how long this code was executed in total.
   * an example of the output:
   * [2020-12-04 16:24:46.100 -0500] INFO	 (31641): loadingComponent: 14ms. (total repeating 14ms)
   * [2020-12-04 16:24:46.110 -0500] INFO	 (31641): loadingComponent: 18ms. (total repeating 32ms)
   */
  profile(id: string, console?: boolean) {
    const msg = this.profiler.profile(id);
    if (!msg) return;
    const fullMsg = `${id}: ${msg}`;
    console ? this.console(fullMsg) : this.info(fullMsg);
  }

  async exitAfterFlush(code, commandName: string, cliOutput = '') {
    // await Analytics.sendData();
    const isSuccess = code === 0;
    const level = isSuccess ? 'info' : 'error';
    if (cliOutput) {
      this.logger.info(`[+] CLI-OUTPUT: ${cliOutput}`);
    }
    const msg = isSuccess
      ? `[*] the command "${commandName}" has been completed successfully`
      : `[*] the command "${commandName}" has been terminated with an error code ${code}`;
    this.logger[level](msg);
    if (!this.isDaemon) process.exit(code);
  }

  debugAndAddBreadCrumb(
    category: string,
    message: string,
    data?: Record<string, any>,
    extraData?: Record<string, any>
  ) {
    this.addToLoggerAndToBreadCrumb('debug', category, message, data, extraData);
  }

  warnAndAddBreadCrumb(
    category: string,
    message: string,
    data?: Record<string, any>,
    extraData?: Record<string, any>
  ) {
    this.addToLoggerAndToBreadCrumb('warn', category, message, data, extraData);
  }

  errorAndAddBreadCrumb(
    category: string,
    message: string,
    data?: Record<string, any>,
    extraData?: Record<string, any>
  ) {
    this.addToLoggerAndToBreadCrumb('error', category, message, data, extraData);
  }

  private addToLoggerAndToBreadCrumb(
    level: string,
    category: string,
    message: string,
    data?: Record<string, any>,
    extraData?: Record<string, any> | null | undefined
  ) {
    if (!category) throw new TypeError('addToLoggerAndToBreadCrumb, category is missing');
    if (!message) throw new TypeError('addToLoggerAndToBreadCrumb, message is missing');
    const messageWithData = data ? format(message, data) : message;
    this.logger[level](`${category}, ${messageWithData}`, extraData);
    // addBreadCrumb(category, message, data, extraData);
  }

  switchToConsoleLogger(level?: Level) {
    this.logger = pinoLoggerConsole;
    this.logger.level = level || 'debug';
  }
}

const logger = new ArcoLogger(pinoLogger);

export function writeLogToScreen(levelOrPrefix = '') {
  if (isLevel(levelOrPrefix)) {
    logger.switchToConsoleLogger(levelOrPrefix);
  }
}

(function determineWritingLogToScreen() {
  /**
   * prefix ARCO_LOG to the command, provides the ability to log into the console.
   * two options are available here:
   * 1) use the level. e.g. `ARCO_LOG=error arco import`.
   * 2) use the message prefix, e.g. `ARCO_LOG=ssh arco import`.
   * 3) use multiple message prefixes, e.g. `ARCO_LOG=ssh,env arco import`.
   */
  if (process.env.ARCO_LOG) {
    writeLogToScreen(process.env.ARCO_LOG);
    return;
  }

  // more common scenario is when the user enters `--log` flag. It can be just "--log", which defaults to info.
  // or it can have a level: `--log=error` or `--log error`: both syntaxes are supported
  if (process.argv.includes('--log')) {
    const level = process.argv.find((arg) => LEVELS.includes(arg)) as Level | undefined;
    logger.switchToConsoleLogger(level || 'info');
    return;
  }
  LEVELS.forEach((level) => {
    if (process.argv.includes(`--log=${level}`)) {
      logger.switchToConsoleLogger(level as Level);
    }
  });
})();

export default logger;
