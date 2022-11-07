import { MainRuntime } from '@arco-cli/cli/dist/cli.aspect';
import { LoggerAspect } from './logger.aspect';

import { Logger } from './logger';

export class LoggerMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static provider() {
    return new LoggerMain();
  }

  constructor() {}

  createLogger(extensionName: string): Logger {
    return new Logger(extensionName);
  }
}

LoggerAspect.addRuntime(LoggerMain);
