import path from 'path';
import fs from 'fs-extra';
import minimatch from 'minimatch';
import { compile } from 'sass';
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

  constructor(readonly id: string, options: SassCompilerOptions) {
    this.distDir = options.distDir || DEFAULT_DIST_DIRNAME;
    this.sassOptions = options.sassOptions || {};
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
    const result = await Promise.all(
      context.components.map(async (component) => {
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
                const cssFile = compile(file.path, this.sassOptions).css;
                const targetPath = path.join(
                  component.packageDirAbs,
                  this.distDir,
                  this.getDistPathBySrcPath(file.relative)
                );

                await fs.ensureFileSync(targetPath);
                await fs.writeFile(targetPath, cssFile);

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
      componentsResults: result,
    };
  }
}
