import path from 'path';
import fs from 'fs-extra';
import type { CompilerOptions } from 'typescript';

type TSConfig = {
  extends?: string;
  include?: string[];
  exclude?: string[];
  compilerOptions: CompilerOptions;
};

/**
 * load compilerOptions from tsconfig.json, and handle extends
 */
export function flatTSConfig(filePath: string) {
  const tsconfig = fs.readJsonSync(filePath) as TSConfig;
  return _loadTSConfig(tsconfig, path.dirname(filePath));
}

function _loadTSConfig(tsconfig: TSConfig, cwd: string, stack: string[] = []): TSConfig {
  const { extends: extendsPath, compilerOptions = {}, ...restTSConfig } = tsconfig;

  if (!extendsPath) {
    return tsconfig;
  }

  const extendPathAbs = path.resolve(cwd, extendsPath);
  if (stack.indexOf(extendPathAbs) > -1) {
    throw new Error(
      `Load TypeScript config failed. Circular dependency detected: ${stack.join(' -> ')}`
    );
  }

  const parentTsconfig = fs.readJsonSync(extendPathAbs) as TSConfig;

  return _loadTSConfig(
    {
      ...parentTsconfig,
      ...restTSConfig,
      compilerOptions: {
        ...parentTsconfig.compilerOptions,
        ...compilerOptions,
      },
    },
    path.dirname(extendPathAbs),
    [...stack, extendPathAbs]
  );
}
