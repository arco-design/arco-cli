import path from 'path';
import fs from 'fs-extra';
import { get } from 'lodash';
import { CLIAspect, CLIMain, MainRuntime } from '@arco-cli/core/dist/cli';
import { LoggerAspect, LoggerMain, Logger } from '@arco-cli/core/dist/logger';
import { WorkspaceAspect, Workspace } from '@arco-cli/aspect/dist/workspace';
import { Generator } from '@arco-cli/generator';

import { GeneratorAspect } from './generator.aspect';
import { CreateCmd } from './create.cmd';

type GeneratorConfig = {
  defaultPath?: string;
};

export type CreateComponentOptions = {
  name: string;
  path?: string;
  force?: boolean;
};

export class GeneratorMain {
  static runtime = MainRuntime;

  static dependencies = [LoggerAspect, CLIAspect, WorkspaceAspect];

  static provider(
    [loggerMain, cli, workspace]: [LoggerMain, CLIMain, Workspace],
    config: GeneratorConfig
  ) {
    const logger = loggerMain.createLogger(GeneratorAspect.id);
    const generator = new GeneratorMain(config, logger, workspace);
    cli.register(new CreateCmd(workspace, generator));
    return generator;
  }

  constructor(
    private config: GeneratorConfig,
    private logger: Logger,
    private workspace: Workspace
  ) {}

  async createComponent({
    name,
    force,
    path: generatePath = this.config.defaultPath,
  }: CreateComponentOptions): Promise<{ ok: boolean; message: string }> {
    const generator = new Generator(name, 'component', { path: generatePath });
    const targetPath = generator.getTargetPath();
    const componentRootDir = path.relative(this.workspace.path, targetPath);

    if (fs.existsSync(targetPath)) {
      if (force) {
        fs.removeSync(targetPath);
      } else {
        return {
          ok: false,
          message: `already a component-dir exist at ${targetPath}, use the '--force' flag to overwrite it`,
        };
      }
    }

    const longProcessLogger = this.logger.createLongProcessLogger(
      `create a new component named ${name} to ${targetPath}`
    );
    const { manifest } = await generator.generate();

    const newWorkspaceConfig = { ...this.workspace.config };
    const componentConfig = {
      name,
      rootDir: componentRootDir.replace(/\/[^/]*$/, ''),
      entries: {
        base: name,
        ...manifest.entries,
      },
    };

    newWorkspaceConfig.components ||= { members: [] };
    if (Array.isArray(newWorkspaceConfig.components)) {
      newWorkspaceConfig.components.push(componentConfig);
    } else {
      const extendsRule = newWorkspaceConfig.components.extends;
      const deleteExtendProperties = (obj: Record<string, any>, parentPath = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const propertyPath = parentPath ? `${parentPath}.${key}` : key;
          if (JSON.stringify(get(extendsRule, propertyPath)) === JSON.stringify(value)) {
            delete obj[key];
          } else if (typeof value === 'object' && value !== null) {
            deleteExtendProperties(value, propertyPath);
          }
        });
      };
      deleteExtendProperties(componentConfig);
      newWorkspaceConfig.components.members.push(componentConfig);
    }

    this.workspace.updateWorkspaceConfigFile(WorkspaceAspect.id, newWorkspaceConfig);
    longProcessLogger.end();

    return {
      ok: true,
      message: `new component [${name}] has been created successfully at '${componentRootDir.replace(
        /^[^.]/,
        ($0) => `./${$0}`
      )}'`,
    };
  }
}

GeneratorAspect.addRuntime(GeneratorMain);
