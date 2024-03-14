import path from 'path';
import minimatch from 'minimatch';
import { render, version } from 'less';
import type { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';
import type { BuildContext, BuildTaskResult } from '@arco-cli/service/dist/builder';
import type { Compiler } from '@arco-cli/service/dist/compiler';
import { compileStyle } from '@arco-cli/service/dist/compiler/utils/compileStyle';
import {
  DEFAULT_DIST_DIRNAME,
  DEFAULT_BUILD_IGNORE_PATTERNS,
} from '@arco-cli/legacy/dist/constants';

import type { LessCompilerOptions } from './compilerOptions';

export class LessCompiler implements Compiler {
  readonly displayName = 'Less';

  distDir: string;

  shouldCopySourceFiles = true;

  ignorePatterns = DEFAULT_BUILD_IGNORE_PATTERNS;

  lessOptions: LessCompilerOptions['lessOptions'];

  combine: LessCompilerOptions['combine'];

  userCustomCompileFn: LessCompilerOptions['compile'];

  constructor(readonly id: string, options: LessCompilerOptions) {
    this.distDir = options.distDir || DEFAULT_DIST_DIRNAME;
    this.lessOptions = options.lessOptions || {};
    this.combine = options.combine || false;
    this.userCustomCompileFn = options.compile;
  }

  getDistPathBySrcPath(srcPath: string): string {
    return srcPath.replace('.less', '.css');
  }

  isFileSupported(filePath: string): boolean {
    return filePath.endsWith('.less');
  }

  version(): string {
    return version.join('.');
  }

  getDistDir() {
    return this.distDir;
  }

  async build(context: BuildContext): Promise<BuildTaskResult> {
    const workspaceNodeModulePath = path.resolve(context.workspace.path, 'node_modules');
    const results: ComponentResult[] = [];

    for (const component of context.components) {
      const packageNodeModulePath = path.resolve(component.packageDirAbs, 'node_modules');
      // eslint-disable-next-line no-await-in-loop
      const componentResult = await compileStyle({
        component,
        distDir: this.distDir,
        shouldCopySourceFiles: this.shouldCopySourceFiles,
        rawFileExt: 'less',
        combine: this.combine,
        compile: async ({ pathSource, getContents }) => {
          const { css } = await render(getContents(), {
            javascriptEnabled: true,
            ...this.lessOptions,
            paths: [
              path.dirname(pathSource),
              packageNodeModulePath,
              workspaceNodeModulePath,
              ...(this.lessOptions?.paths || []),
            ],
          });
          return css;
        },
        userCustomCompileFn: this.userCustomCompileFn,
        filter: (file) => {
          for (const pattern of this.ignorePatterns) {
            if (minimatch(file.path, pattern)) {
              return false;
            }
          }
          return this.isFileSupported(file.path);
        },
      });

      results.push(componentResult);
    }

    return {
      componentsResults: results,
    };
  }
}
