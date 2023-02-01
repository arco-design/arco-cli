import path from 'path';
import fs from 'fs-extra';
import { Component } from '@arco-cli/aspect/dist/component';

import { BuildContext, BuildTask, BuildTaskResult, TaskResultsList } from '@service/builder';

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

  private async clearDistDir(component: Component, compiler: Compiler) {
    const distDirAbs = path.resolve(component.packageDirAbs, compiler.distDir);
    return fs.remove(distDirAbs);
  }

  private async copyNonSupportedFiles(component: Component, compiler: Compiler) {
    await Promise.all(
      component.files.map(async (file) => {
        if (compiler.isFileSupported(file.path)) return;
        const content = file.contents;
        const filePath = path.join(component.packageDirAbs, compiler.distDir, file.relative);
        await fs.ensureFileSync(filePath);
        await fs.outputFile(filePath, content);
      })
    );
  }

  async execute(context: BuildContext): Promise<BuildTaskResult> {
    const uniqueComponents: Component[] = [];
    for (const component of context.components) {
      if (!uniqueComponents.find((com) => com.componentDir === component.componentDir)) {
        uniqueComponents.push(component);
      }
    }

    // we reduce the list size of components that need to be built according to componentDir
    // no need to repeat the build process multiple times if the components have the same root directory
    // but do NOT change buildContext directly
    const buildResults = await this.compilerInstance.build({
      ...context,
      components: uniqueComponents,
    } as BuildContext);

    return buildResults;
  }

  async preBuild(context: BuildContext) {
    await Promise.all(
      context.components.map(async (component) => {
        // should clear dist dir at first, then do other operations
        await this.clearDistDir(component, this.compilerInstance);
        await this.copyNonSupportedFiles(component, this.compilerInstance);
      })
    );
    await this.compilerInstance.preBuild?.(context);
  }

  async postBuild?(context: BuildContext, tasksResults: TaskResultsList): Promise<void> {
    await this.compilerInstance.postBuild?.(context, tasksResults);
  }
}
