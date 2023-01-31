import { join, resolve } from 'path';
import { cloneDeep } from 'lodash';
import ts from 'typescript';
import { CompilerEnv, PreviewEnv, TesterEnv } from '@arco-cli/aspect/dist/envs';
import { JestMain } from '@arco-cli/aspect/dist/jest';
import { Tester } from '@arco-cli/service/dist/tester';
import { CompilerMain, Compiler, CompilerOptions } from '@arco-cli/service/dist/compiler';
import {
  Bundler,
  BundlerContext,
  DevServer,
  DevServerContext,
} from '@arco-cli/aspect/dist/bundler';
import { pathNormalizeToLinux } from '@arco-cli/legacy/dist/utils/path';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';
import {
  TypescriptMain,
  TsConfigTransformer,
  TypescriptCompilerOptions,
} from '@arco-cli/aspect/dist/typescript';
import { WebpackConfigTransformer, WebpackMain } from '@arco-cli/aspect/dist/webpack';
import { MultiCompilerMain } from '@arco-cli/service/dist/multi-compiler';
import { SassMain } from '@arco-cli/aspect/dist/sass';
import { LessMain } from '@arco-cli/aspect/dist/less';
import {
  PreviewStrategyName,
  COMPONENT_PREVIEW_STRATEGY_NAME,
} from '@arco-cli/service/dist/preview';
import { sha1 } from '@arco-cli/legacy/dist/utils';
import { Workspace } from '@arco-cli/aspect/dist/workspace';

import { ReactAspect } from './react.aspect';
import basePreviewConfigFactory from './webpack/webpack.config.base';
import basePreviewProdConfigFactory from './webpack/webpack.config.base.prod';
import componentPreviewDevConfigFactory from './webpack/webpack.config.component.dev';
import componentPreviewProdConfigFactory from './webpack/webpack.config.component.prod';
import { Doclet, parser } from './tsdoc';
import { ReactConfig } from './types/reactConfig';

type CreateTsCompilerTaskOptions = {
  tsModule?: typeof ts;
  transformers?: TsConfigTransformer[];
  compilerOptions?: CompilerOptions;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultTsConfig = require('./typescript/tsconfig.json');

export class ReactEnv implements TesterEnv<Tester>, CompilerEnv<Compiler>, PreviewEnv {
  constructor(
    private config: ReactConfig,
    private workspace: Workspace,
    private compiler: CompilerMain,
    private multiCompiler: MultiCompilerMain,
    private jest: JestMain,
    private tsAspect: TypescriptMain,
    private webpack: WebpackMain,
    private less: LessMain,
    private sass: SassMain
  ) {}

  // TODO caching logic should be refactored to DocsAspect
  private docMetadataCache: Record<string, { hash: string; docletList: Doclet[] }> = {};

  private createTsCompilerOptions(): TypescriptCompilerOptions {
    const tsconfig = cloneDeep(defaultTsConfig);
    const currentDir = pathNormalizeToLinux(__dirname);
    const compileJs = true;
    const compileJsx = true;
    return {
      tsconfig,
      types: [
        resolve(currentDir, './typescript/style.d.ts'),
        resolve(currentDir, './typescript/asset.d.ts'),
      ],
      compileJs,
      compileJsx,
    };
  }

  private async createWebpackBundler(
    context: BundlerContext,
    transformers: WebpackConfigTransformer[] = []
  ): Promise<Bundler> {
    return this.webpack.createBundler(context, transformers);
  }

  private async createComponentsWebpackBundler(
    context: BundlerContext,
    transformers: WebpackConfigTransformer[] = []
  ): Promise<Bundler> {
    const baseConfig = basePreviewConfigFactory(!context.development);
    const baseProdConfig = basePreviewProdConfigFactory(context.development);
    const componentProdConfig = componentPreviewProdConfigFactory();

    const defaultTransformer: WebpackConfigTransformer = (configMutator) => {
      const merged = configMutator.merge([baseConfig, baseProdConfig, componentProdConfig]);
      return merged;
    };
    const mergedTransformers = [defaultTransformer, ...transformers];
    return this.createWebpackBundler(context, mergedTransformers);
  }

  private createCjsJestTester(jestConfigPath?: string, jestModulePath?: string): Tester {
    const defaultConfigPath = this.config.jestConfigPath
      ? join(this.workspace.path, this.config.jestConfigPath)
      : join(__dirname, './jest/jest.cjs.config.js');
    const config = jestConfigPath || defaultConfigPath;
    return this.jest.createTester(config, jestModulePath || require.resolve('jest'));
  }

  private createEsmCompiler(transformers: TsConfigTransformer[] = [], tsModule = ts) {
    const tsCompileOptions = this.createTsCompilerOptions();
    return this.tsAspect.createEsmCompiler(tsCompileOptions, transformers, tsModule);
  }

  private createCjsCompiler(transformers: TsConfigTransformer[] = [], tsModule = ts) {
    const tsCompileOptions = this.createTsCompilerOptions();
    return this.tsAspect.createCjsCompiler(tsCompileOptions, transformers, tsModule);
  }

  /**
   * required for `arco start`
   */
  getDevEnvId() {
    return ReactAspect.id;
  }

  getTester(jestConfigPath: string, jestModulePath?: string): Tester {
    return this.createCjsJestTester(jestConfigPath, jestModulePath);
  }

  getCompiler(transformers: TsConfigTransformer[] = [], tsModule = ts): Compiler {
    return this.multiCompiler.createCompiler([
      this.createCjsCompiler(transformers, tsModule),
      this.less.createCompiler(),
      this.sass.createCompiler(),
    ]);
  }

  createEsmCompilerTask({
    transformers,
    tsModule,
    compilerOptions,
  }: CreateTsCompilerTaskOptions = {}) {
    return this.compiler.createTask(
      'TSCompilerESM',
      this.multiCompiler.createCompiler(
        [
          this.createEsmCompiler(transformers, tsModule),
          this.less.createCompiler(),
          this.sass.createCompiler(),
        ],
        compilerOptions
      )
    );
  }

  createCjsCompilerTask({
    transformers,
    tsModule,
    compilerOptions,
  }: CreateTsCompilerTaskOptions = {}) {
    return this.compiler.createTask(
      'TSCompilerCJS',
      this.multiCompiler.createCompiler(
        [
          this.createCjsCompiler(transformers, tsModule),
          this.less.createCompiler(),
          this.sass.createCompiler(),
        ],
        compilerOptions
      )
    );
  }

  getDevServer(
    context: DevServerContext,
    transformers: WebpackConfigTransformer[] = []
  ): DevServer {
    const baseConfig = basePreviewConfigFactory(false);
    const componentDevConfig = componentPreviewDevConfigFactory(context.id);

    const defaultTransformer: WebpackConfigTransformer = (configMutator) => {
      const merged = configMutator.merge([baseConfig, componentDevConfig]);
      return merged;
    };

    return this.webpack.createDevServer(context, [defaultTransformer, ...transformers]);
  }

  getDocsTemplate() {
    return require.resolve('@arco-cli/ui-foundation-react/dist/preview/index.js');
  }

  getDocsMetadata(file: SourceFile) {
    if (!file) return [];

    const hash = sha1(file.contents);
    if (this.docMetadataCache[file.path]?.hash !== hash) {
      const docletList = parser(file);
      this.docMetadataCache[file.path] = {
        hash,
        docletList,
      };
    }

    return this.docMetadataCache[file.path].docletList;
  }

  getPreviewConfig() {
    return {
      strategyName: COMPONENT_PREVIEW_STRATEGY_NAME as PreviewStrategyName,
      splitComponentBundle: true,
      isScaling: true,
    };
  }

  async getBundler(
    context: BundlerContext,
    transformers: WebpackConfigTransformer[] = []
  ): Promise<Bundler> {
    return this.createComponentsWebpackBundler(context, transformers);
  }
}
