import path from 'path';
import ts from 'typescript';
import { Compiler, TranspileFileOutput, TranspileFileParams } from '@arco-cli/compiler';
import { TypescriptCompilerOptions } from './compilerOptions';
import { TsConfigPareFailedError } from './exceptions';

export class TypescriptCompiler implements Compiler {
  displayName = 'TypeScript';

  deleteDistDir = false;

  distDir: string;

  shouldCopyNonSupportedFiles: boolean;

  artifactName: string;

  constructor(
    readonly id: string,
    private options: TypescriptCompilerOptions,
    private tsModule: typeof ts
  ) {
    this.distDir = options.distDir || 'dist';
    this.shouldCopyNonSupportedFiles =
      typeof options.shouldCopyNonSupportedFiles === 'boolean'
        ? options.shouldCopyNonSupportedFiles
        : true;
    this.artifactName = options.artifactName || 'dist';
    this.options.tsconfig ||= {};
    this.options.tsconfig.compilerOptions ||= {};
  }

  private stringifyTsconfig(tsconfig) {
    return JSON.stringify(tsconfig, undefined, 2);
  }

  private replaceFileExtToJs(filePath: string): string {
    if (!this.isFileSupported(filePath)) return filePath;
    const fileExtension = path.extname(filePath);
    return filePath.replace(new RegExp(`${fileExtension}$`), '.js');
  }

  private getFormatDiagnosticsHost(): ts.FormatDiagnosticsHost {
    return {
      getCanonicalFileName: (p) => p,
      getCurrentDirectory: this.tsModule.sys.getCurrentDirectory,
      getNewLine: () => this.tsModule.sys.newLine,
    };
  }

  version() {
    return this.tsModule.version;
  }

  displayConfig() {
    return this.stringifyTsconfig(this.options.tsconfig);
  }

  getDistDir() {
    return this.distDir;
  }

  getDistPathBySrcPath(srcPath: string) {
    const fileWithJSExtIfNeeded = this.replaceFileExtToJs(srcPath);
    return path.join(this.distDir, fileWithJSExtIfNeeded);
  }

  isFileSupported(filePath: string): boolean {
    const isJsAndCompile = !!this.options.compileJs && filePath.endsWith('.js');
    const isJsxAndCompile = !!this.options.compileJsx && filePath.endsWith('.jsx');
    return (
      (filePath.endsWith('.ts') ||
        filePath.endsWith('.tsx') ||
        isJsAndCompile ||
        isJsxAndCompile) &&
      !filePath.endsWith('.d.ts')
    );
  }

  transpileFile(fileContent: string, options: TranspileFileParams): TranspileFileOutput {
    if (!this.isFileSupported(options.filePath)) {
      return null;
    }

    const compilerOptionsFromTsconfig = this.tsModule.convertCompilerOptionsFromJson(
      this.options.tsconfig.compilerOptions,
      '.'
    );

    if (compilerOptionsFromTsconfig.errors.length) {
      const formattedErrors = this.tsModule.formatDiagnosticsWithColorAndContext(
        compilerOptionsFromTsconfig.errors,
        this.getFormatDiagnosticsHost()
      );
      throw new TsConfigPareFailedError(`failed parsing the tsconfig.json.\n${formattedErrors}`);
    }

    const compilerOptions = compilerOptionsFromTsconfig.options;
    compilerOptions.sourceRoot = options.componentDir;
    compilerOptions.rootDir = '.';
    const result = this.tsModule.transpileModule(fileContent, {
      compilerOptions,
      fileName: options.filePath,
      reportDiagnostics: true,
    });

    if (result.diagnostics && result.diagnostics.length) {
      const formatHost = this.getFormatDiagnosticsHost();
      const error = this.tsModule.formatDiagnosticsWithColorAndContext(
        result.diagnostics,
        formatHost
      );
      throw new Error(error);
    }

    const outputPath = this.replaceFileExtToJs(options.filePath);
    const outputFiles = [{ outputText: result.outputText, outputPath }];
    if (result.sourceMapText) {
      outputFiles.push({
        outputText: result.sourceMapText,
        outputPath: `${outputPath}.map`,
      });
    }
    return outputFiles;
  }
}
