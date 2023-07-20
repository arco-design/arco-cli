import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { Component } from '@arco-cli/aspect/dist/component';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';

import type { StyleCompilerOptions, StyleFileToCompile } from '../types';

export type CompileStyleOptions = {
  component: Component;
  distDir: string;
  shouldCopySourceFiles: boolean;
  rawFileExt: 'sass' | 'less';
  combine: StyleCompilerOptions['combine'];
  compile: (fileInfo: StyleFileToCompile) => Promise<string>;
  userCustomCompileFn: StyleCompilerOptions['compile'];
  filter: (file: SourceFile) => boolean;
};

export async function compileStyle({
  component,
  distDir,
  shouldCopySourceFiles,
  combine,
  compile,
  userCustomCompileFn,
  filter,
  rawFileExt,
}: CompileStyleOptions) {
  const componentResult = {
    id: component.id,
    errors: [],
  };

  const filesToCompile: Array<StyleFileToCompile> = [];
  const combineFileInfo: { rawFilePath: string; cssFilePath: string; deps: string[] } = {
    rawFilePath: '',
    cssFilePath: '',
    deps: [],
  };

  const getDistPathBySrcPath = (srcPath: string): string => {
    return srcPath.replace(new RegExp(`\\.${rawFileExt}$`, 'i'), '.css');
  };

  component.files.forEach((file) => {
    const valid = filter(file);
    if (!valid) return;

    const fileToCompile: StyleFileToCompile = {
      getContents: () => file.contents.toString(),
      pathSource: file.path,
      pathTarget: path.join(component.packageDirAbs, distDir, file.relative),
    };
    filesToCompile.push(fileToCompile);

    if (combine) {
      const combineFilename =
        typeof combine === 'object' && combine.filename
          ? combine.filename
          : `style/index.${rawFileExt}`;
      const sorter = typeof combine === 'object' ? combine.sorter : null;
      combineFileInfo.rawFilePath ||= path.join(component.packageDirAbs, distDir, combineFilename);
      combineFileInfo.cssFilePath ||= getDistPathBySrcPath(combineFileInfo.rawFilePath);
      combineFileInfo.deps.push(fileToCompile.pathTarget);
      if (typeof sorter === 'function') {
        combineFileInfo.deps = combineFileInfo.deps.sort(sorter);
      }
    }
  });

  if (combineFileInfo.rawFilePath) {
    const styleDistDir = path.dirname(combineFileInfo.rawFilePath);
    const content = combineFileInfo.deps
      .map((depPath) => {
        // we got an error "semicolons aren't allowed in the indented syntax." while compiling scss
        // so remove semicolon at end of line
        return `@import '${path.relative(styleDistDir, depPath)}'${
          rawFileExt === 'less' ? ';' : ''
        }`;
      })
      .join(os.EOL);
    await fs.ensureFile(combineFileInfo.rawFilePath);
    await fs.writeFile(combineFileInfo.rawFilePath, content);
    filesToCompile.push({
      getContents: () => content,
      pathSource: combineFileInfo.rawFilePath,
      pathTarget: combineFileInfo.rawFilePath,
    });
  }

  // we should copy source file to dist before compiling
  // otherwise not found error will throw while combine-less compiling
  const shouldCopySourceFileBeforeCompile = !!combineFileInfo.rawFilePath;
  const copySourceFileToTarget = async ({ pathSource, pathTarget }: StyleFileToCompile) => {
    if (shouldCopySourceFiles && pathSource !== pathTarget) {
      await fs.ensureDir(path.dirname(pathTarget));
      await fs.copyFile(pathSource, pathTarget);
    }
  };

  if (shouldCopySourceFileBeforeCompile) {
    await Promise.all(filesToCompile.map(copySourceFileToTarget));
  }

  await Promise.all(
    filesToCompile.map(async (file) => {
      try {
        const cssContent =
          typeof userCustomCompileFn === 'function'
            ? await userCustomCompileFn(file, compile)
            : await compile(file);
        const targetCssPath = getDistPathBySrcPath(file.pathTarget);

        await fs.ensureFile(targetCssPath);
        await fs.writeFile(targetCssPath, cssContent);
      } catch (err) {
        componentResult.errors.push(err);
      }

      if (!shouldCopySourceFileBeforeCompile) {
        await copySourceFileToTarget(file);
      }
    })
  );

  return componentResult;
}
