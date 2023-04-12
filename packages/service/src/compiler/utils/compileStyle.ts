import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { Component } from '@arco-cli/aspect/dist/component';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';

import { StyleCompilerOptions } from '../types';

type FileToCompile = { pathOrigin: string; pathTarget: string; getContent: () => string };

export type CompileStyleOptions = {
  component: Component;
  distDir: string;
  shouldCopySourceFiles: boolean;
  rawFileExt: 'sass' | 'less';
  combine: StyleCompilerOptions['combine'];
  compile: (fileInfo: FileToCompile) => Promise<string>;
  filter: (file: SourceFile) => boolean;
};

export async function compileStyle({
  component,
  distDir,
  shouldCopySourceFiles,
  combine,
  compile,
  filter,
  rawFileExt,
}: CompileStyleOptions) {
  const componentResult = {
    id: component.id,
    errors: [],
  };

  const filesToCompile: Array<FileToCompile> = [];
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

    const fileToCompile: FileToCompile = {
      getContent: () => file.contents.toString(),
      pathOrigin: file.path,
      pathTarget: path.join(component.packageDirAbs, distDir, file.relative),
    };
    filesToCompile.push(fileToCompile);

    if (combine) {
      const combineFilename =
        typeof combine === 'object' && combine.filename
          ? combine.filename
          : `style/index.${rawFileExt}`;
      combineFileInfo.rawFilePath ||= path.join(component.packageDirAbs, distDir, combineFilename);
      combineFileInfo.cssFilePath ||= getDistPathBySrcPath(combineFileInfo.rawFilePath);
      const styleDistDir = path.dirname(combineFileInfo.rawFilePath);
      // we got an error "semicolons aren't allowed in the indented syntax." while compiling scss
      // so remove semicolon at end of line
      combineFileInfo.deps.push(
        `@import '${path.relative(styleDistDir, fileToCompile.pathTarget)}'${
          rawFileExt === 'less' ? ';' : ''
        }`
      );
    }
  });

  if (combineFileInfo.rawFilePath) {
    const content = combineFileInfo.deps.join(os.EOL);
    await fs.ensureFile(combineFileInfo.rawFilePath);
    await fs.writeFile(combineFileInfo.rawFilePath, content);
    filesToCompile.push({
      getContent: () => content,
      pathOrigin: combineFileInfo.rawFilePath,
      pathTarget: combineFileInfo.rawFilePath,
    });
  }

  // we should copy source file to dist before compiling
  // otherwise not found error will throw while combine-less compiling
  const shouldCopySourceFileBeforeCompile = !!combineFileInfo.rawFilePath;
  const copySourceFileToTarget = async ({ pathOrigin, pathTarget }: FileToCompile) => {
    if (shouldCopySourceFiles && pathOrigin !== pathTarget) {
      await fs.ensureDir(path.dirname(pathTarget));
      await fs.copyFile(pathOrigin, pathTarget);
    }
  };

  if (shouldCopySourceFileBeforeCompile) {
    await Promise.all(filesToCompile.map(copySourceFileToTarget));
  }

  await Promise.all(
    filesToCompile.map(async (file) => {
      try {
        const cssContent = await compile(file);
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
