import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import minimatch from 'minimatch';
import { compile, compileString } from 'sass';
import { Compiler } from '@arco-cli/service/dist/compiler';
import { BuildContext, BuildTaskResult } from '@arco-cli/service/dist/builder';
import {
  DEFAULT_BUILD_IGNORE_PATTERNS,
  DEFAULT_DIST_DIRNAME,
} from '@arco-cli/legacy/dist/constants';

import { SassCompilerOptions } from './compilerOptions';

export class SassCompiler implements Compiler {
  readonly displayName = 'Sass';

  distDir: string;

  shouldCopySourceFiles = true;

  ignorePatterns = DEFAULT_BUILD_IGNORE_PATTERNS;

  sassOptions: SassCompilerOptions['sassOptions'];

  combine: SassCompilerOptions['combine'];

  constructor(readonly id: string, options: SassCompilerOptions) {
    this.distDir = options.distDir || DEFAULT_DIST_DIRNAME;
    this.sassOptions = options.sassOptions || {};
    this.combine = options.combine || false;
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
    const result = await Promise.all(
      context.components.map(async (component) => {
        const packageNodeModulePath = path.resolve(component.packageDirAbs, 'node_modules');
        const componentResult = {
          id: component.id,
          errors: [],
        };
        let combineCssPath: string;
        let combineSassPath: string;
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
                const cssFile = compile(file.path, this.sassOptions).css;
                const targetPath = path.join(component.packageDirAbs, this.distDir, file.relative);
                const targetCssPath = this.getDistPathBySrcPath(targetPath);

                await fs.ensureFile(targetCssPath);
                await fs.writeFile(targetCssPath, cssFile);

                if (this.combine) {
                  const distFile =
                    typeof this.combine === 'object' && this.combine.filename
                      ? this.combine.filename
                      : 'style/index.scss';
                  combineSassPath = path.join(component.packageDirAbs, this.distDir, distFile);
                  if (!combineCssPath) {
                    combineCssPath = this.getDistPathBySrcPath(combineSassPath);
                  }
                  const distPath = path.dirname(
                    path.join(component.packageDirAbs, this.distDir, distFile)
                  );
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
          await fs.ensureFile(combineSassPath);
          await fs.writeFile(combineSassPath, content);
          const { css } = compileString(content, {
            loadPaths: [
              path.dirname(combineSassPath),
              packageNodeModulePath,
              workspaceNodeModulePath,
            ],
            ...this.sassOptions,
          });
          await fs.ensureFile(combineCssPath);
          await fs.writeFile(combineCssPath, css);
        }

        return componentResult;
      })
    );

    return {
      componentsResults: result,
    };
  }
}
