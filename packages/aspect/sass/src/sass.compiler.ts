import { compileString } from 'sass';
import path from 'path';
import fs from 'fs-extra';
import {
  Compiler,
  CompilerOptions,
  TranspileFileParams,
  TranspileFileOutput,
} from '@arco-cli/compiler';
import { BuildContext, BuildTaskResult } from '@arco-cli/builder';
import { DEFAULT_DIST_DIRNAME } from '@arco-cli/legacy/dist/constants';

export class SassCompiler implements Compiler {
  readonly displayName = 'Sass';

  distDir: string;

  shouldCopyNonSupportedFiles = false;

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

  transpileFile(fileContent: string, options: TranspileFileParams): TranspileFileOutput {
    const cssContent = compileString(fileContent).css;

    return [
      {
        outputText: cssContent,
        outputPath: this.getDistPathBySrcPath(options.filePath),
      },
    ];
  }

  async build(context: BuildContext): Promise<BuildTaskResult> {
    const result = context.components.flatMap((component) => {
      return component.files
        .filter((file) => {
          return this.isFileSupported(file.path);
        })
        .map((file) => {
          try {
            const cssFile = compileString(file.contents.toString()).css;
            const targetPath = path.join(
              component.packageDirAbs,
              this.distDir,
              this.getDistPathBySrcPath(file.relative)
            );
            fs.writeFileSync(targetPath, cssFile);
            return {
              component,
            };
          } catch (err) {
            return {
              component,
              errors: [err],
            };
          }
        });
    });

    return {
      componentsResults: result,
    };
  }
}
