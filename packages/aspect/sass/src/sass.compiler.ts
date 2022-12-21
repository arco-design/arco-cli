import { compileString } from 'sass';
import { Compiler, TranspileFileParams, TranspileFileOutput } from '@arco-cli/compiler';

export class SassCompiler implements Compiler {
  distDir = 'dist';

  shouldCopyNonSupportedFiles = false;

  constructor(readonly id: string, readonly displayName = 'Sass') {}

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
}
