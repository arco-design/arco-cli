import { compile } from 'sass';
import { Compiler, TranspileFileParams, TranspileFileOutput } from '@arco-cli/compiler';

export class SassCompiler implements Compiler {
  distDir = 'dist';

  shouldCopyNonSupportedFiles = false;

  constructor(readonly id: string, readonly displayName = 'Less') {}

  getDistPathBySrcPath(srcPath: string): string {
    return srcPath.replace('.less', '.css');
  }

  isFileSupported(filePath: string): boolean {
    return filePath.endsWith('.less');
  }

  version(): string {
    return '';
  }

  getDistDir() {
    return this.distDir;
  }

  transpileFile(fileContent: string, options: TranspileFileParams): TranspileFileOutput {
    const cssContent = compile(fileContent).css;

    return [
      {
        outputText: cssContent,
        outputPath: options.filePath,
      },
    ];
  }
}
