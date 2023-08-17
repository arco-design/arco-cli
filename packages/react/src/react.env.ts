import { join, resolve } from 'path';
import fs from 'fs-extra';
import { cloneDeep } from 'lodash';
import ts from 'typescript';
import { PreviewEnv, TesterEnv, ExecutionContext } from '@arco-cli/aspect/dist/envs';
import { BuildTask } from '@arco-cli/service/dist/builder';
import { JestMain } from '@arco-cli/aspect/dist/jest';
import { Tester } from '@arco-cli/service/dist/tester';
import { CompilerMain, CompilerOptions } from '@arco-cli/service/dist/compiler';
import type {
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
import { MultiCompilerMain } from '@arco-cli/aspect/dist/multi-compiler';
import { SassMain, SassCompilerOptions } from '@arco-cli/aspect/dist/sass';
import { LessMain, LessCompilerOptions } from '@arco-cli/aspect/dist/less';
import {
  PreviewStrategyName,
  COMPONENT_PREVIEW_STRATEGY_NAME,
} from '@arco-cli/service/dist/preview';
import { sha1 } from '@arco-cli/legacy/dist/utils';
import {
  BUILD_TASK_NAME_COMPILER_ESM,
  BUILD_TASK_NAME_COMPILER_CJS,
} from '@arco-cli/legacy/dist/constants';
import type { Doclet } from '@arco-cli/legacy/dist/types';
import { Workspace } from '@arco-cli/aspect/dist/workspace';

import { ReactAspect } from './react.aspect';
import basePreviewConfigFactory from './webpack/webpack.config.base';
import componentPreviewDevConfigFactory from './webpack/webpack.config.component.dev';
import componentPreviewProdConfigFactory from './webpack/webpack.config.component.prod';
import { parser } from './tsdoc';

type CreateCompilerTaskOptions = {
  tsModule?: typeof ts;
  tsConfigTransformers?: TsConfigTransformer[];
  multiCompilerOptions?: CompilerOptions;
  lessCompilerOptions?: LessCompilerOptions;
  sassCompilerOptions?: SassCompilerOptions;
};

type DocMetadataCache = Record<string, { hash: string; metadata: Doclet[] }>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultTsConfig = require('./typescript/tsconfig.json');

const DEFAULT_ESM_DIR = 'es';
const DEFAULT_CJS_DIR = 'lib';

export class ReactEnv implements TesterEnv<Tester>, PreviewEnv {
  constructor(
    private workspace: Workspace,
    private compiler: CompilerMain,
    private multiCompiler: MultiCompilerMain,
    private jest: JestMain,
    private tsAspect: TypescriptMain,
    private webpack: WebpackMain,
    private less: LessMain,
    private sass: SassMain
  ) {}

  get cacheDir(): string {
    return this.workspace?.getCacheDir(ReactAspect.id);
  }

  get docMetadataCachePath(): string {
    return join(this.cacheDir, 'docMetadataCache.json');
  }

  private getDocMetadataCache(): DocMetadataCache {
    try {
      return fs.readJSONSync(this.docMetadataCachePath);
    } catch (err) {}
    return {};
  }

  private cacheDocMetadata(cache: DocMetadataCache) {
    try {
      fs.writeJSONSync(this.docMetadataCachePath, cache);
    } catch (err) {}
  }

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

  private async createComponentsWebpackBundler(
    context: BundlerContext,
    transformers: WebpackConfigTransformer[] = []
  ): Promise<Bundler> {
    const baseConfig = basePreviewConfigFactory(!context.development);
    const componentProdConfig = componentPreviewProdConfigFactory();

    const defaultTransformer: WebpackConfigTransformer = (configMutator) => {
      const merged = configMutator.merge([baseConfig, componentProdConfig]);
      return merged;
    };
    const mergedTransformers = [defaultTransformer, ...transformers];
    return this.webpack.createBundler(context, mergedTransformers);
  }

  private createCjsJestTester(jestConfigPath?: string, jestModulePath?: string): Tester {
    const defaultConfigPath = join(__dirname, './jest/jest.cjs.config.js');
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

  private createEsmCompilerTask({
    tsModule,
    tsConfigTransformers,
    multiCompilerOptions,
    lessCompilerOptions,
    sassCompilerOptions,
  }: CreateCompilerTaskOptions = {}) {
    return this.compiler.createTask(
      BUILD_TASK_NAME_COMPILER_ESM,
      this.multiCompiler.createCompiler(
        [
          this.createEsmCompiler(tsConfigTransformers, tsModule),
          this.less.createCompiler(lessCompilerOptions),
          this.sass.createCompiler(sassCompilerOptions),
        ],
        multiCompilerOptions
      )
    );
  }

  private createCjsCompilerTask({
    tsModule,
    tsConfigTransformers,
    multiCompilerOptions,
    lessCompilerOptions,
    sassCompilerOptions,
  }: CreateCompilerTaskOptions = {}) {
    return this.compiler.createTask(
      BUILD_TASK_NAME_COMPILER_CJS,
      this.multiCompiler.createCompiler(
        [
          this.createCjsCompiler(tsConfigTransformers, tsModule),
          this.less.createCompiler(lessCompilerOptions),
          this.sass.createCompiler(sassCompilerOptions),
        ],
        multiCompilerOptions
      )
    );
  }

  /**
   * required for `arco start`
   */
  getDevEnvId(id?: string) {
    return typeof id === 'string' ? id : ReactAspect.id;
  }

  getTester(jestConfigPath: string, jestModulePath?: string): Tester {
    return this.createCjsJestTester(jestConfigPath, jestModulePath);
  }

  getDevServer(
    context: DevServerContext,
    transformers: WebpackConfigTransformer[] = []
  ): DevServer {
    const baseConfig = basePreviewConfigFactory(false);
    const componentDevConfig = componentPreviewDevConfigFactory(
      (context as any as ExecutionContext).id
    );

    const defaultTransformer: WebpackConfigTransformer = (configMutator) => {
      const merged = configMutator.merge([baseConfig, componentDevConfig]);
      return merged;
    };

    return this.webpack.createDevServer(context, [defaultTransformer, ...transformers]);
  }

  getDocsTemplate() {
    return require.resolve('@arco-cli/ui-foundation-react/dist/preview/index.js');
  }

  getDocsMetadata(files: SourceFile[]): Doclet[] {
    const cache = this.getDocMetadataCache();
    const result = files.reduce((acc, file) => {
      if (!file?.contents) return acc;

      const hash = sha1(file.contents);

      if (!cache[file.path] || cache[file.path].hash !== hash) {
        const docletList = parser(file);
        cache[file.path] = {
          hash,
          metadata: docletList,
        };
      }

      return acc.concat(cache[file.path]?.metadata);
    }, [] as Doclet[]);

    this.cacheDocMetadata(cache);

    return result;
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

  getBuildPipe(modifiers: CreateCompilerTaskOptions): BuildTask[] {
    return [
      this.createEsmCompilerTask({
        ...modifiers,
        multiCompilerOptions: { distDir: DEFAULT_ESM_DIR },
      }),
      this.createCjsCompilerTask({
        ...modifiers,
        multiCompilerOptions: { distDir: DEFAULT_CJS_DIR },
      }),
    ];
  }
}
