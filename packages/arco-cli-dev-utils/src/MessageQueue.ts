import print from './print';

class MessageQueue {
  description: string;

  info: string[];

  success: string[];

  warn: string[];

  error: string[];

  constructor({ description }) {
    this.description = description;
    this.info = [];
    this.success = [];
    this.warn = [];
    this.error = [];
  }

  /**
   * @param {'info' | 'success' | 'warn' | 'error'} type
   * @param  {string[]} messages
   */
  push(type, messages) {
    this[type] && this[type].push(messages);
  }

  flush() {
    const chalk = print.chalk;
    print.divider();
    print(
      `${this.description} ${chalk.green(`SUCCESS(${this.success.length})`)} ${chalk.yellow(
        `WARN(${this.warn.length})`
      )} ${chalk.red(`ERROR(${this.error.length})`)}`
    );
    this.info.forEach((messages) => print.info(...messages));
    this.success.forEach((messages) => print.success(...messages));
    this.warn.forEach((messages) => print.warn(...messages));
    this.error.forEach((messages) => print.error(...messages));
    print.divider();
  }
}

export default MessageQueue;
