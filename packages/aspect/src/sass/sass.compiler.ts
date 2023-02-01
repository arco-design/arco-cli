import path from 'path';
import fs from 'fs-extra';
import { compile } from 'sass';
import {
  Compiler,
  CompilerOptions,
  TranspileFileParams,
  TranspileFileOutput,
} from '@arco-cli/service/dist/compiler';
import { BuildContext, BuildTaskResult } from '@arco-cli/service/dist/builder';
import { DEFAULT_DIST_DIRNAME } from '@arco-cli/legacy/dist/constants';

export class SassCompiler implements Compiler {
  readonly displayName = 'Sass';

  distDir: string;

  constructor(readonly id: string, options: Partial<CompilerOptions>) {
    this.distDir = options.distDir || DEFAULT_DIST_DIRNAME;
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

  transpileFile(_fileContent: string, options: TranspileFileParams): TranspileFileOutput {
    const filePath = path.resolve(options.componentDir, options.filePath);
    const cssContent = compile(filePath).css;

    return [
      {
        outputText: cssContent,
        outputPath: this.getDistPathBySrcPath(options.filePath),
      },
    ];
  }

  async build(context: BuildContext): Promise<BuildTaskResult> {
    const result = await Promise.all(
      context.components.map(async (component) => {
        const componentResult = {
          component,
          errors: [],
        };

        await Promise.all(
          component.files
            .filter((file) => {
              return this.isFileSupported(file.path);
            })
            .map(async (file) => {
              try {
                const cssFile = compile(file.path).css;
                const targetPath = path.join(
                  component.packageDirAbs,
                  this.distDir,
                  this.getDistPathBySrcPath(file.relative)
                );
                await fs.ensureFileSync(targetPath);
                await fs.writeFile(targetPath, cssFile);
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
