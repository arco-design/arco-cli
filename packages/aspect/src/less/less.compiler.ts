import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import minimatch from 'minimatch';
import { render, version } from 'less';
import { BuildContext, BuildTaskResult } from '@arco-cli/service/dist/builder';
import { Compiler } from '@arco-cli/service/dist/compiler';
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

  constructor(readonly id: string, options: LessCompilerOptions) {
    this.distDir = options.distDir || DEFAULT_DIST_DIRNAME;
    this.lessOptions = options.lessOptions || {};
    this.combine = options.combine || false;
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
    const results = await Promise.all(
      context.components.map(async (component) => {
        const packageNodeModulePath = path.resolve(component.packageDirAbs, 'node_modules');
        const componentResult = {
          id: component.id,
          errors: [],
        };
        let combineCssPath: string;
        let combineLessPath: string;
        const deps: string[] = [];

        await Promise.all(
          component.files
            .filter((file) => {
              for (const pattern of this.ignorePatterns) {
                if (minimatch(file.path, pattern)) {
                  return false;
                }
              }
              return this.isFileSupported(file.path);
            })
            .map(async (file) => {
              try {
                const fileDirPath = path.dirname(file.path);
                const { css } = await render(file.contents.toString(), {
                  paths: [fileDirPath, packageNodeModulePath, workspaceNodeModulePath],
                  javascriptEnabled: true,
                  ...this.lessOptions,
                });
                const targetPath = path.join(component.packageDirAbs, this.distDir, file.relative);
                const targetCssPath = this.getDistPathBySrcPath(targetPath);

                await fs.ensureFile(targetCssPath);
                await fs.writeFile(targetCssPath, css);

                if (this.combine) {
                  const distFile =
                    typeof this.combine === 'object' && this.combine.filename
                      ? this.combine.filename
                      : 'style/index.less';
                  combineLessPath = path.join(component.packageDirAbs, this.distDir, distFile);
                  if (!combineCssPath) {
                    combineCssPath = this.getDistPathBySrcPath(combineLessPath);
                  }
                  const distPath = path.dirname(path.join(component.packageDirAbs, this.distDir, distFile));
                  deps.push(`@import '${path.relative(distPath, targetPath)}';`);
                }

                if (this.shouldCopySourceFiles) {
                  await fs.copyFile(
                    file.path,
                    path.join(component.packageDirAbs, this.distDir, file.relative)
                  );
                }
              } catch (err) {
                componentResult.errors.push(err);
              }
            })
        );

        if (this.combine) {
          const content = deps.join(os.EOL);
          await fs.ensureFile(combineLessPath);
          await fs.writeFile(combineLessPath, content);
          const { css } = await render(content, {
            paths: [path.dirname(combineLessPath), packageNodeModulePath, workspaceNodeModulePath],
            javascriptEnabled: true,
            ...this.lessOptions,
          });
          await fs.ensureFile(combineCssPath);
          await fs.writeFile(combineCssPath, css);
        }

        return componentResult;
      })
    );

    return {
      componentsResults: results,
    };
  }
}
