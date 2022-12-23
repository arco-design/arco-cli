import path from 'path';
import fs from 'fs-extra';
import { Component } from '@arco-cli/component';
import { BuildContext, BuildTask, BuildTaskResult, TaskResultsList } from '@arco-cli/builder';
import { Compiler } from './types';

export type CompilerTaskOptions = {
  /**
   * name of compiler task
   */
  name?: string;
};

export class CompilerTask implements BuildTask {
  readonly description = 'compile components';

  constructor(
    readonly aspectId: string,
    readonly name: string,
    private compilerInstance: Compiler
  ) {}

  async execute(context: BuildContext): Promise<BuildTaskResult> {
    const buildResults = await this.compilerInstance.build(context);
    return buildResults;
  }

  async preBuild(context: BuildContext) {
    await Promise.all(
      context.components.map((component) =>
        this.copyNonSupportedFiles(component, this.compilerInstance)
      )
    );
    if (!this.compilerInstance.preBuild) return;
    await this.compilerInstance.preBuild(context);
  }

  async postBuild?(context: BuildContext, tasksResults: TaskResultsList): Promise<void> {
    if (!this.compilerInstance.postBuild) return;
    await this.compilerInstance.postBuild(context, tasksResults);
  }

  async copyNonSupportedFiles(component: Component, compiler: Compiler) {
    await Promise.all(
      component.files.map(async (file) => {
        if (compiler.isFileSupported(file.path)) return;
        const content = file.contents;
        await fs.outputFile(
          path.join(component.packageDirAbs, compiler.distDir, file.relative),
          content
        );
      })
    );
  }
}
