import chalk from 'chalk';
import loader from '@arco-cli/legacy/dist/cli/loader';
import logger, { IArcoLogger } from '@arco-cli/legacy/dist/logger';

import { LongProcessLogger } from './longProcessLogger';

export class Logger implements IArcoLogger {
  constructor(private extensionName: string) {}

  get isLoaderStarted() {
    return loader.isStarted;
  }

  trace(message: string, ...meta: any[]) {
    logger.trace(this.colorMessage(message), ...meta);
  }

  debug(message: string, ...meta: any[]) {
    logger.debug(this.colorMessage(message), ...meta);
  }

  info(message: string, ...meta: any[]) {
    logger.info(this.colorMessage(message), ...meta);
  }

  warn(message: string, ...meta: any[]) {
    logger.warn(this.colorMessage(message), ...meta);
  }

  error(message: string, ...meta: any[]) {
    logger.error(this.colorMessage(message), ...meta);
  }

  fatal(message: string, ...meta: any[]) {
    logger.fatal(this.colorMessage(message), ...meta);
  }

  createLongProcessLogger(processDescription: string, totalItems?: number): LongProcessLogger {
    return new LongProcessLogger(this, this.extensionName, processDescription, totalItems);
  }

  /**
   * single status-line on bottom of the screen.
   * the text is replaced every time this method is called.
   */
  setStatusLine(text: string) {
    loader.setTextAndRestart(text);
  }

  /**
   * remove the text from the last line on the screen.
   */
  clearStatusLine() {
    loader.stop();
  }

  clearConsole() {
    logger.clearConsole();
  }

  /**
   * print to the screen. if message is empty, print the last logged message.
   */
  console(message?: string, ...meta: any[]) {
    if (message) this.info(message, meta);
    if (!loader.isStarted && logger.shouldWriteToConsole) {
      console.log(message, ...meta);
    } else {
      loader.stopAndPersist({ text: message });
    }
  }

  consoleWarn(message?: string, ...meta: any[]) {
    if (message) this.warn(message, ...meta);
    if (!loader.isStarted && logger.shouldWriteToConsole) {
      console.warn(message, ...meta);
    } else {
      loader.stopAndPersist({ text: message });
    }
  }

  consoleError(message?: string, ...meta: any[]) {
    if (message) this.error(message, ...meta);
    if (!loader.isStarted && logger.shouldWriteToConsole) {
      console.error(message, ...meta);
    } else {
      loader.stopAndPersist({ text: message });
    }
  }

  /**
   * print to the screen as a title, with bold text.
   */
  consoleTitle(message: string) {
    this.info(message);
    loader.stopAndPersist({ text: chalk.bold(message) });
  }

  /**
   * print to the screen with a green `✔` prefix. if message is empty, print the last logged message.
   */
  consoleSuccess(message?: string) {
    if (message) this.info(message);
    loader.succeed(message);
  }

  /**
   * turn off the logger.
   */
  off() {
    return loader.off();
  }

  on() {
    return loader.on();
  }

  profile(id: string, console?: boolean) {
    logger.profile(id, console);
  }

  /**
   * print to the screen with a red `✖` prefix. if message is empty, print the last logged message.
   */
  consoleFailure(message?: string) {
    if (message) this.error(message);
    loader.fail(message);
  }

  /**
   * print to the screen with a red `⚠` prefix. if message is empty, print the last logged message.
   */
  consoleWarning(message?: string) {
    if (message) {
      this.warn(message);
      message = chalk.yellow(message);
    }
    loader.warn(message);
  }

  private colorMessage(message: string) {
    if (logger.isJsonFormat) return `${this.extensionName}, ${message}`;
    return `${chalk.bold(this.extensionName)}, ${message}`;
  }
}
