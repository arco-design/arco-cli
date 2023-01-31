import { CompilerAspect } from './compiler.aspect';

export default CompilerAspect;
export { CompilerAspect };
export type { CompilerMain } from './compiler.main.runtime';
export {
  Compiler,
  CompilerOptions,
  CompilationInitiator,
  TranspileFileOutput,
  TranspileFileParams,
  TranspileComponentParams,
} from './types';
export * from './events';
