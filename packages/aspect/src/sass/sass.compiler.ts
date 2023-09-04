import path from 'path';
import minimatch from 'minimatch';
import { compile } from 'sass';
import type { Compiler } from '@arco-cli/service/dist/compiler';
import type { BuildContext, BuildTaskResult } from '@arco-cli/service/dist/builder';
import type { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';
import {
  DEFAULT_BUILD_IGNORE_PATTERNS,
  DEFAULT_DIST_DIRNAME,
} from '@arco-cli/legacy/dist/constants';
import { compileStyle } from '@arco-cli/service/dist/compiler/utils/compileStyle';

import type { SassCompilerOptions } from './compilerOptions';

export class SassCompiler implements Compiler {
  readonly displayName = 'Sass';

  distDir: string;

  shouldCopySourceFiles = true;

  ignorePatterns = DEFAULT_BUILD_IGNORE_PATTERNS;

  sassOptions: SassCompilerOptions['sassOptions'];

  combine: SassCompilerOptions['combine'];

  userCustomCompileFn: SassCompilerOptions['compile'];

  constructor(readonly id: string, options: SassCompilerOptions) {
    this.distDir = options.distDir || DEFAULT_DIST_DIRNAME;
    this.sassOptions = options.sassOptions || {};
    this.combine = options.combine || false;
    this.userCustomCompileFn = options.compile;
  }

  getDistPathBySrcPath(srcPath: string): string {
    return srcPath.replace('.scss', '.css');
  }

  isFileSupported(filePath: string): boolean {
    return filePath.endsWith('.scss');
  }

  version(): string {
    return '';
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
        rawFileExt: 'sass',
        combine: this.combine,
        compile: async ({ pathSource }) => {
          return compile(pathSource, {
            loadPaths: [path.dirname(pathSource), packageNodeModulePath, workspaceNodeModulePath],
            ...this.sassOptions,
          }).css;
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
