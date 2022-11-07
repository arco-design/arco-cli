import ts from 'typescript';
import { MainRuntime } from '@arco-cli/cli';
import { Compiler } from '@arco-cli/compiler';
import { TypescriptAspect } from './typescript.aspect';
import { TypescriptCompiler } from './typescript.compiler';
import { TypescriptCompilerOptions } from './compilerOptions';
import { TypescriptConfigMutator } from './typescriptConfigMutator';

export type TsConfigTransformContext = {
  // mode: TsMode;
};

export type TsConfigTransformer = (
  config: TypescriptConfigMutator,
  context: TsConfigTransformContext
) => TypescriptConfigMutator;

function runTransformersWithContext(
  config: TypescriptConfigMutator,
  context: TsConfigTransformContext,
  transformers: TsConfigTransformer[] = []
): TypescriptConfigMutator {
  if (!Array.isArray(transformers)) return config;
  const newConfig = transformers.reduce((acc, transformer) => {
    return transformer(acc, context);
  }, config);
  return newConfig;
}

export class TypescriptMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static provider() {
    return new TypescriptMain();
  }

  constructor() {}

  /**
   * Create a transformer that change the ts module to CommonJS
   */
  getCjsTransformer(): TsConfigTransformer {
    return (config: TypescriptConfigMutator) => {
      config.setModule('CommonJS');
      return config;
    };
  }

  /**
   * Create a transformer that change the ts module to ES2020
   */
  getEsmTransformer(): TsConfigTransformer {
    return (config: TypescriptConfigMutator) => {
      config.setModule('ES2020');
      return config;
    };
  }

  /**
   * create a new compiler.
   */
  createCompiler(
    options: TypescriptCompilerOptions,
    transformers: TsConfigTransformer[] = [],
    tsModule = ts
  ): Compiler {
    const configMutator = new TypescriptConfigMutator(options);
    const transformerContext: TsConfigTransformContext = {};
    const afterMutation = runTransformersWithContext(
      configMutator.clone(),
      transformerContext,
      transformers
    );
    return new TypescriptCompiler(TypescriptAspect.id, afterMutation.raw, tsModule);
  }

  /**
   * Create a compiler instance and run the cjs transformer for it
   */
  createCjsCompiler(
    options: TypescriptCompilerOptions,
    transformers: TsConfigTransformer[] = [],
    tsModule = ts
  ) {
    return this.createCompiler(options, [this.getCjsTransformer(), ...transformers], tsModule);
  }

  /**
   * Create a compiler instance and run the esm transformer for it
   */
  createEsmCompiler(
    options: TypescriptCompilerOptions,
    transformers: TsConfigTransformer[] = [],
    tsModule = ts
  ) {
    return this.createCompiler(options, [this.getEsmTransformer(), ...transformers], tsModule);
  }
}

TypescriptAspect.addRuntime(TypescriptMain);
