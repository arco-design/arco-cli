import { cloneDeep, mergeWith, isArray } from 'lodash';
import { CompilerOptions } from 'typescript';
import { TypescriptCompilerOptions } from './compilerOptions';

export type Target =
  | 'ES3'
  | 'ES5'
  | 'ES2015'
  | 'ES2016'
  | 'ES2017'
  | 'ES2018'
  | 'ES2019'
  | 'ES2020'
  | 'ESNext';

// eslint-disable-next-line consistent-return
export function tsconfigMergeCustomizer(objValue, extendValue, key) {
  // only concat array for tsconfig.include/exclude
  if (['include', 'exclude'].indexOf(key) > -1 && isArray(objValue)) {
    return objValue.concat(extendValue);
  }
}

export class TypescriptConfigMutator {
  constructor(public raw: TypescriptCompilerOptions) {}

  clone(): TypescriptConfigMutator {
    return new TypescriptConfigMutator(cloneDeep(this.raw));
  }

  artifactName?: string;

  setName(name: string) {
    this.raw.name = name;
    return this;
  }

  setArtifactName(artifactName: string) {
    this.raw.artifactName = artifactName;
    return this;
  }

  addTypes(typesPaths: string[]): TypescriptConfigMutator {
    this.raw.types.push(...typesPaths);
    return this;
  }

  setExperimentalDecorators(value: boolean): TypescriptConfigMutator {
    this.raw.tsconfig.compilerOptions.experimentalDecorators = value;
    return this;
  }

  /**
   * Set ts compiler target option - https://www.typescriptlang.org/tsconfig#target
   */
  setTarget(target: Target): TypescriptConfigMutator {
    this.raw.tsconfig.compilerOptions.target = target;
    return this;
  }

  /**
   * Set ts compiler module option - https://www.typescriptlang.org/tsconfig#module
   */
  setModule(module: string): TypescriptConfigMutator {
    this.raw.tsconfig.compilerOptions.module = module;
    return this;
  }

  /**
   * This will change the dist dir for all relevant places:
   * 1. the dist dir of the compiler instance
   * 2. add exclude for the dist dir in the tsconfig
   * 3. set the outDir of the tsconfig
   */
  setDistDir(distDir: string): TypescriptConfigMutator {
    this.raw.distDir = distDir;
    this.addExclude([distDir]);
    this.setOutDir(distDir);
    return this;
  }

  setOutDir(outDir: string): TypescriptConfigMutator {
    this.raw.tsconfig.compilerOptions.outDir = outDir;
    return this;
  }

  setCompilerOptions(options: CompilerOptions): TypescriptConfigMutator {
    this.raw.tsconfig.compilerOptions = options;
    return this;
  }

  setTsConfig(config: Record<string, any>): TypescriptConfigMutator {
    this.raw.tsconfig = config;
    return this;
  }

  mergeTsConfig(config: Record<string, any>): TypescriptConfigMutator {
    this.raw.tsconfig = mergeWith({}, this.raw.tsconfig, config, tsconfigMergeCustomizer);
    return this;
  }

  addExclude(exclusions: string[]): TypescriptConfigMutator {
    this.raw.tsconfig.exclude.push(...exclusions);
    return this;
  }

  /**
   * Run the compiler for .js files. this will only affect whether to run the compiler on the files
   * or not. It won't change the tsconfig to support or not support js files.
   */
  setCompileJs(compileJs: boolean) {
    this.raw.compileJs = compileJs;
    return this;
  }

  /**
   * Run the compiler for .js files. this will only affect whether to run the compiler on the files
   * or not. It won't change the tsconfig to support or not support jsx files.
   */
  setCompileJsx(compileJsx: boolean) {
    this.raw.compileJsx = compileJsx;
    return this;
  }
}
