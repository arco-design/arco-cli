import path from 'path';
import fs from 'fs-extra';
import ts from 'typescript';
import { merge, cloneDeep } from 'lodash';
import { Logger } from '@arco-cli/core/dist/logger';
import { Compiler } from '@arco-cli/service/dist/compiler';
import ArcoError from '@arco-cli/legacy/dist/error/arcoError';
import { BuildContext, BuildTaskResult } from '@arco-cli/service/dist/builder';
import { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';
import {
  DEFAULT_DIST_DIRNAME,
  DEFAULT_BUILD_IGNORE_PATTERNS,
} from '@arco-cli/legacy/dist/constants';
import { toFsCompatible } from '@arco-cli/legacy/dist/utils';

import { TypescriptCompilerOptions } from './compilerOptions';
import TypescriptAspect from './typescript.aspect';

const FILENAME_TSCONFIG = 'tsconfig.json';

export class TypescriptCompiler implements Compiler {
  displayName = 'TypeScript';

  deleteDistDir = false;

  distDir: string;

  artifactName: string;

  ignorePatterns = DEFAULT_BUILD_IGNORE_PATTERNS;

  private componentTsConfigMap: Record<string, string> = {};

  constructor(
    readonly id: string,
    private options: TypescriptCompilerOptions,
    private tsModule: typeof ts,
    private logger: Logger
  ) {
    this.distDir = options.distDir || DEFAULT_DIST_DIRNAME;
    this.artifactName = options.artifactName || DEFAULT_DIST_DIRNAME;
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

  private getCacheDir(context: BuildContext) {
    return context.workspace.getCacheDir(TypescriptAspect.id);
  }

  private async writeComponentTsConfig(context: BuildContext) {
    const workspacePath = context.workspace.path;
    await Promise.all(
      context.components.map(async ({ id: componentId, rootDir, packageDirAbs }) => {
        const rootDirAbs = path.join(workspacePath, rootDir);
        const outDirAbs = path.join(packageDirAbs, this.distDir);
        const tsconfig: Record<string, any> = cloneDeep(this.options.tsconfig);

        // try to merge tsconfig.json from component package
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const tsconfigFromPackage = require(`${packageDirAbs}/tsconfig.json`);
          merge(tsconfig, tsconfigFromPackage);
        } catch (e) {}

        // avoid change this.options.config directly
        // different components might have different ts configs
        merge(tsconfig, {
          include: [rootDirAbs],
          exclude: this.ignorePatterns.map((pattern) => path.join(rootDirAbs, '**', pattern)),
          compilerOptions: {
            outDir: outDirAbs,
            rootDir: rootDirAbs,
          },
        });

        // convert tsconfig.extends to absolute path
        if (tsconfig.extends && !path.isAbsolute(tsconfig.extends)) {
          tsconfig.extends = path.resolve(packageDirAbs, tsconfig.extends);
        }

        const tsconfigPath = path.join(
          this.getCacheDir(context),
          toFsCompatible(componentId),
          `${this.distDir}.${FILENAME_TSCONFIG}`
        );
        await fs.ensureFile(tsconfigPath);
        await fs.writeFile(tsconfigPath, this.stringifyTsconfig(tsconfig));
        this.componentTsConfigMap[componentId] = tsconfigPath;
      })
    );
  }

  private async writeProjectReferencesTsConfig(context): Promise<string> {
    const cacheDir = this.getCacheDir(context);
    const references = context.components.map((com) => {
      return { path: this.componentTsConfigMap[com.id] || com.packageDirAbs };
    });
    const tsconfig = { files: [], references };
    const tsconfigStr = this.stringifyTsconfig(tsconfig);
    await fs.writeFile(path.join(cacheDir, FILENAME_TSCONFIG), tsconfigStr);
    return cacheDir;
  }

  private async runTscBuild(context: BuildContext): Promise<ComponentResult[]> {
    const { components } = context;

    if (!components.length) {
      return [];
    }

    const componentsResults: ComponentResult[] = [];
    const formatHost = {
      getCanonicalFileName: (p) => p,
      getCurrentDirectory: () => '', // it helps to get the files with absolute paths
      getNewLine: () => this.tsModule.sys.newLine,
    };

    let currentComponentResult: Partial<ComponentResult> = { errors: [] };
    const reportDiagnostic = (diagnostic: ts.Diagnostic) => {
      const errorStr = process.stdout.isTTY
        ? this.tsModule.formatDiagnosticsWithColorAndContext([diagnostic], formatHost)
        : this.tsModule.formatDiagnostic(diagnostic, formatHost);
      if (!diagnostic.file) {
        // the error is general and not related to a specific file. e.g. tsconfig is missing.
        throw new ArcoError(errorStr);
      }
      this.logger.consoleFailure(errorStr);
      if (!currentComponentResult.id || !currentComponentResult.errors) {
        throw new Error(`currentComponentResult is not defined yet for ${diagnostic.file}`);
      }
      currentComponentResult.errors.push(errorStr);
    };

    // this only works when `verbose` is `true` in the `ts.createSolutionBuilder` function.
    const reportSolutionBuilderStatus = (diag: ts.Diagnostic) => {
      const msg = diag.messageText as string;
      this.logger.debug(msg);
    };
    const errorCounter = (errorCount: number) => {
      this.logger.info(`total error found: ${errorCount}`);
    };
    const host = this.tsModule.createSolutionBuilderHost(
      undefined,
      undefined,
      reportDiagnostic,
      reportSolutionBuilderStatus,
      errorCounter
    );

    const rootDir = await this.writeProjectReferencesTsConfig(context);
    const solutionBuilder = this.tsModule.createSolutionBuilder(host, [rootDir], {
      verbose: true,
    });
    const longProcessLogger = this.logger.createLongProcessLogger(
      'compile typescript components',
      components.length
    );

    let nextProject;
    // eslint-disable-next-line no-cond-assign
    while ((nextProject = solutionBuilder.getNextInvalidatedProject())) {
      // nextProject is path of its tsconfig.json
      const projectPath = path.dirname(nextProject.project);
      const component = components.find((com) => {
        // tsconfig.json for component building will be generated in cache dir named component_id
        // find target component of this tsconfig.json
        return path.basename(projectPath) === toFsCompatible(com.id);
      });
      if (!component) throw new Error(`unable to find component for ${projectPath}`);

      longProcessLogger.logProgress(component.id);
      currentComponentResult.id = component.id;
      currentComponentResult.startTime = Date.now();
      nextProject.done();
      currentComponentResult.endTime = Date.now();
      componentsResults.push({ ...currentComponentResult } as ComponentResult);
      currentComponentResult = { errors: [] };
    }

    longProcessLogger.end();
    return componentsResults;
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

  async preBuild(context: BuildContext) {
    await this.writeComponentTsConfig(context);
  }

  async build(context: BuildContext): Promise<BuildTaskResult> {
    const componentsResults = await this.runTscBuild(context);
    return {
      componentsResults,
    };
  }
}
