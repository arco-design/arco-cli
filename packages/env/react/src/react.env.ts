import { join, resolve } from 'path';
import { cloneDeep } from 'lodash';
import ts from 'typescript';
import { CompilerEnv, PreviewEnv, TesterEnv } from '@arco-cli/envs';
import { JestMain } from '@arco-cli/jest';
import { Tester } from '@arco-cli/tester';
import { Compiler } from '@arco-cli/compiler';
import { Workspace } from '@arco-cli/workspace';
import { Bundler, BundlerContext, DevServer, DevServerContext } from '@arco-cli/bundler';
import { pathNormalizeToLinux } from '@arco-cli/legacy/dist/utils/path';
import {
  TypescriptMain,
  TsConfigTransformer,
  TypescriptCompilerOptions,
} from '@arco-cli/typescript';
import { WebpackConfigTransformer, WebpackMain } from '@arco-cli/webpack';
import { MultiCompilerMain } from '@arco-cli/multi-compiler';
import { SassMain } from '@arco-cli/sass';
import { LessMain } from '@arco-cli/less';
import { PreviewStrategyName, COMPONENT_PREVIEW_STRATEGY_NAME } from '@arco-cli/preview';

import { ReactAspect } from './react.aspect';
import basePreviewConfigFactory from './webpack/webpack.config.base';
import basePreviewProdConfigFactory from './webpack/webpack.config.base.prod';
import componentPreviewDevConfigFactory from './webpack/webpack.config.component.dev';
import componentPreviewProdConfigFactory from './webpack/webpack.config.component.prod';

type CompilerMode = 'build' | 'dev';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultTsConfig = require('./typescript/tsconfig.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildTsConfig = require('./typescript/tsconfig.build.json');

export class ReactEnv implements TesterEnv<Tester>, CompilerEnv<Compiler>, PreviewEnv {
  constructor(
    private workspace: Workspace,
    private multiCompiler: MultiCompilerMain,
    private jest: JestMain,
    private tsAspect: TypescriptMain,
    private webpack: WebpackMain,
    private less: LessMain,
    private sass: SassMain
  ) {}

  private createTsCompilerOptions(mode: CompilerMode = 'dev'): TypescriptCompilerOptions {
    const tsconfig = mode === 'dev' ? cloneDeep(defaultTsConfig) : cloneDeep(buildTsConfig);
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

  createCjsJestTester(jestConfigPath?: string, jestModulePath?: string): Tester {
    const defaultConfig = join(__dirname, './jest/jest.cjs.config.js');
    const config = jestConfigPath || defaultConfig;
    return this.jest.createTester(config, jestModulePath || require.resolve('jest'));
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

  createTsEsmCompiler(
    mode: CompilerMode = 'dev',
    transformers: TsConfigTransformer[] = [],
    tsModule = ts
  ) {
    const tsCompileOptions = this.createTsCompilerOptions(mode);
    return this.tsAspect.createEsmCompiler(tsCompileOptions, transformers, tsModule);
  }

  createTsCjsCompiler(
    mode: CompilerMode = 'dev',
    transformers: TsConfigTransformer[] = [],
    tsModule = ts
  ) {
    const tsCompileOptions = this.createTsCompilerOptions(mode);
    return this.tsAspect.createCjsCompiler(tsCompileOptions, transformers, tsModule);
  }

  getCompiler(transformers: TsConfigTransformer[] = [], tsModule = ts): Compiler {
    // TODO determine es module type
    return this.multiCompiler.createCompiler([
      this.createTsCjsCompiler('dev', transformers, tsModule),
      this.less.createCompiler(),
      this.sass.createCompiler(),
    ]);
  }

  getDevServer(
    context: DevServerContext,
    transformers: WebpackConfigTransformer[] = []
  ): DevServer {
    const baseConfig = basePreviewConfigFactory(false);
    const componentDevConfig = componentPreviewDevConfigFactory(this.workspace.path, context.id);

    const defaultTransformer: WebpackConfigTransformer = (configMutator) => {
      const merged = configMutator.merge([baseConfig, componentDevConfig]);
      return merged;
    };

    return this.webpack.createDevServer(context, [defaultTransformer, ...transformers]);
  }

  getDocsTemplate() {
    return require.resolve('@arco-cli/ui-foundation-react/dist/docs/index.js');
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
