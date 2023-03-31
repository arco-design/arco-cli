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
                const targetPath = path.join(
                  component.packageDirAbs,
                  this.distDir,
                  this.getDistPathBySrcPath(file.relative)
                );

                await fs.ensureFile(targetPath);
                await fs.writeFile(targetPath, css);

                if (this.combine) {
                  const distFile =
                    typeof this.combine === 'object' && this.combine.filename
                      ? this.combine.filename
                      : 'style/index.less';
                  const targetLessPath = path.join(component.packageDirAbs, this.distDir, distFile);
                  await fs.ensureFile(targetLessPath);
                  await fs.appendFile(
                    targetLessPath,
                    `@import '${path.relative(this.distDir, file.relative)}';${os.EOL}`
                  );
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

        return componentResult;
      })
    );

    return {
      componentsResults: results,
    };
  }
}
