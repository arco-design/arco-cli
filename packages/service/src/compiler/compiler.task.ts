import path from 'path';
import fs from 'fs-extra';
import minimatch from 'minimatch';
import { Component } from '@arco-cli/aspect/dist/component';

import { BuildContext, BuildTask, BuildTaskResult, TaskResultsList } from '@service/builder';

import type { Compiler, CompilerAspectConfig } from './types';
import { sortPackageBuildOrders } from './utils/sortPackageBuildOrders';

export class CompilerTask implements BuildTask {
  readonly description = 'compile components';

  constructor(
    readonly aspectId: string,
    readonly name: string,
    readonly config: CompilerAspectConfig,
    private compilerInstance: Compiler
  ) {}

  private sortContextComponents(components: Component[]) {
    const getSortFn = (orders: string[]) => {
      orders = Array.isArray(orders) ? orders : [];
      // avoid change origin array's order by reverse() and sort()
      orders = [...orders].reverse();
      return ({ id: idA }: Component, { id: idB }: Component) => {
        const indexA = orders.findIndex(
          (keyword) => idA.indexOf(keyword) > -1 || minimatch(idA, keyword)
        );
        const indexB = orders.findIndex(
          (keyword) => idB.indexOf(keyword) > -1 || minimatch(idB, keyword)
        );
        // all components in orderRule should sort to first
        // then sort them by their index in orderRule
        return indexB - indexA;
      };
    };

    const { orders: defaultPackageBuildOrders } = sortPackageBuildOrders(
      components.map(({ packageName, dependencies }) => ({
        name: packageName,
        dependencies: Object.keys(dependencies),
      }))
    );

    return [...components]
      .sort(getSortFn(defaultPackageBuildOrders.map((packageName) => `${packageName}/*`)))
      .sort(getSortFn(this.config.componentCompilationOrders));
  }

  private async clearDistDir(component: Component, compiler: Compiler) {
    const distDirAbs = path.resolve(component.packageDirAbs, compiler.distDir);
    return fs.remove(distDirAbs);
  }

  private async copyNonSupportedFiles(component: Component, compiler: Compiler) {
    await Promise.all(
      component.files
        .filter(({ path: filePath }) => {
          for (const pattern of compiler.ignorePatterns) {
            if (minimatch(filePath, pattern)) {
              return false;
            }
          }
          return !compiler.isFileSupported(filePath);
        })
        .map(async (file) => {
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
      if (!uniqueComponents.find((com) => com.rootDir === component.rootDir)) {
        uniqueComponents.push(component);
      }
    }

    // we reduce the list size of components that need to build according to rootDir
    // no need to repeat the build process multiple times if the components have the same root directory
    // but do NOT change buildContext directly
    const buildResults = await this.compilerInstance.build({
      ...context,
      components: this.sortContextComponents(uniqueComponents),
    } as BuildContext);

    return buildResults;
  }

  async preBuild(context: BuildContext) {
    await Promise.all(
      this.sortContextComponents(context.components).map(async (component) => {
        // should clear dist dir at first, then do other operations
        if (!this.config.skipDeleteDistDir) {
          await this.clearDistDir(component, this.compilerInstance);
        }
        await this.copyNonSupportedFiles(component, this.compilerInstance);
      })
    );
    await this.compilerInstance.preBuild?.(context);
  }

  async postBuild?(context: BuildContext, tasksResults: TaskResultsList): Promise<void> {
    await this.compilerInstance.postBuild?.(context, tasksResults);
  }
}
