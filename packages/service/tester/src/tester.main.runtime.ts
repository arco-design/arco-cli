import { LoggerAspect, LoggerMain } from '@arco-cli/logger';
import { CLIAspect, CLIMain, MainRuntime } from '@arco-cli/cli';
import { Component } from '@arco-cli/component';
import { EnvsAspect, EnvsMain, EnvsExecutionResult } from '@arco-cli/envs';
import { Workspace, WorkspaceAspect } from '@arco-cli/workspace';
import { Tests } from './tester';
import { TestCmd } from './test.cmd';
import TesterAspect from './tester.aspect';
import { TesterOptions, TesterService } from './tester.service';

export class TesterMain {
  static runtime = MainRuntime;

  static dependencies = [CLIAspect, EnvsAspect, LoggerAspect, WorkspaceAspect];

  static slots = [];

  static provider([cli, envs, loggerMain, workspace]: [CLIMain, EnvsMain, LoggerMain, Workspace]) {
    const logger = loggerMain.createLogger(TesterAspect.id);
    const testerService = new TesterService(logger, workspace);
    const tester = new TesterMain(envs, testerService);
    cli.register(new TestCmd(tester, logger, workspace));
    return tester;
  }

  constructor(private envs: EnvsMain, private service: TesterService) {}

  private getOptions(options?: TesterOptions): TesterOptions {
    const defaults: TesterOptions = {
      watch: false,
    };

    return { ...defaults, ...options };
  }

  async test(components: Component[], opts?: TesterOptions): Promise<EnvsExecutionResult<Tests>> {
    const options = this.getOptions(opts);
    const envsRuntime = await this.envs.createEnvironment(components);
    const result = await envsRuntime.run(this.service, options);
    return result;
  }
}

TesterAspect.addRuntime(TesterMain);
