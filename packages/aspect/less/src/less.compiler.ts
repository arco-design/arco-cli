import { render, version } from 'less';
import { Compiler, TranspileFileParams, TranspileFileOutput } from '@arco-cli/compiler';

export class LessCompiler implements Compiler {
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
    return version.join('.');
  }

  getDistDir() {
    return this.distDir;
  }

  transpileFile(fileContent: string, options: TranspileFileParams): TranspileFileOutput {
    const cssContent = render(fileContent);

    return [
      {
        outputText: cssContent.css.toString(),
        outputPath: options.filePath,
      },
    ];
  }
}
