import { join } from 'path';
import pMapSeries from 'p-map-series';
import { Component } from '@arco-cli/aspect/dist/component';
import {
  DEFAULT_DIST_DIRNAME,
  DEFAULT_BUILD_IGNORE_PATTERNS,
} from '@arco-cli/legacy/dist/constants';

import {
  BuildContext,
  BuildTaskResult,
  mergeComponentResults,
  TaskResultsList,
} from '@service/builder';
import {
  Compiler,
  CompilerOptions,
  TranspileFileOutput,
  TranspileFileParams,
} from '@service/compiler';

export class MultiCompiler implements Compiler {
  displayName = 'Multi compiler';

  distDir: string;

  ignorePatterns = DEFAULT_BUILD_IGNORE_PATTERNS;

  constructor(
    readonly id: string,
    readonly compilers: Compiler[],
    readonly compilerOptions: Partial<CompilerOptions> = {}
  ) {
    this.distDir = compilerOptions.distDir || DEFAULT_DIST_DIRNAME;
  }

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

  async preBuild(context: BuildContext) {
    await Promise.all(
      this.compilers.map(async (compiler) => {
        if (!compiler.preBuild) return;
        await compiler.preBuild(context);
      })
    );
  }

  async postBuild(context: BuildContext, taskResults: TaskResultsList) {
    await Promise.all(
      this.compilers.map(async (compiler) => {
        if (!compiler.postBuild) return;
        await compiler.postBuild(context, taskResults);
      })
    );
  }

  async build(context: BuildContext): Promise<BuildTaskResult> {
    const builds = await pMapSeries(this.compilers, async (compiler) => {
      const buildResult = await compiler.build(context);
      return buildResult.componentsResults;
    });

    return {
      componentsResults: mergeComponentResults(builds),
    };
  }
}
