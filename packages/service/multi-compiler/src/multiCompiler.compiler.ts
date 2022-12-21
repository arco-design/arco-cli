import { join } from 'path';
import {
  Compiler,
  CompilerOptions,
  TranspileFileOutput,
  TranspileFileParams,
} from '@arco-cli/compiler';
import { Component } from '@arco-cli/component';

export type MultiCompilerOptions = {
  targetExtension?: string;
};

export class MultiCompiler implements Compiler {
  displayName = 'Multi compiler';

  shouldCopyNonSupportedFiles =
    typeof this.compilerOptions.shouldCopyNonSupportedFiles === 'boolean'
      ? this.compilerOptions.shouldCopyNonSupportedFiles
      : true;

  distDir = 'dist';

  constructor(
    readonly id: string,
    readonly compilers: Compiler[],
    readonly compilerOptions: Partial<CompilerOptions> = {},
    readonly options: MultiCompilerOptions = {}
  ) {}

  private firstMatchedCompiler(filePath: string): Compiler | undefined {
    return this.compilers.find((compiler) => compiler.isFileSupported(filePath));
  }

  version(): string {
    return this.compilers
      .map((compiler) => {
        return `${compiler.displayName}@${compiler.version()}`;
      })
      .join('\n');
  }

  displayConfig() {
    return this.compilers
      .map((compiler) => {
        return `${compiler.displayName}\n${compiler.displayConfig}\n`;
      })
      .join('\n');
  }

  isFileSupported(filePath: string): boolean {
    return !!this.firstMatchedCompiler(filePath);
  }

  getDistDir() {
    return this.distDir;
  }

  getPreviewComponentRootPath(component: Component): string {
    const matchedCompiler = this.compilers.find(
      (compiler) => typeof compiler.getPreviewComponentRootPath !== 'undefined'
    );
    return matchedCompiler?.getPreviewComponentRootPath?.(component) || '';
  }

  /**
   * given a source file, return its parallel in the dists. e.g. "index.ts" => "dist/index.js"
   * both, the return path and the given path are relative paths.
   */
  getDistPathBySrcPath(srcPath: string): string {
    const matchedCompiler = this.firstMatchedCompiler(srcPath);
    if (!matchedCompiler) {
      return join(this.distDir, srcPath);
    }

    return matchedCompiler.getDistPathBySrcPath(srcPath);
  }

  /**
   * the multi-compiler applies all applicable defined compilers on given content.
   */
  transpileFile(fileContent: string, options: TranspileFileParams): TranspileFileOutput {
    const outputs = this.compilers.reduce<any>(
      (files, compiler) => {
        if (!compiler.transpileFile) {
          return files;
        }
        return files?.flatMap((file) => {
          if (!compiler.isFileSupported(file?.outputPath)) return [file];
          const params = { ...options, filePath: file.outputPath };
          const compiledContent = compiler.transpileFile?.(file.outputText, params);
          if (!compiledContent) return null;

          return compiledContent;
        });
      },
      [{ outputText: fileContent, outputPath: options.filePath }]
    );

    return outputs;
  }
}
