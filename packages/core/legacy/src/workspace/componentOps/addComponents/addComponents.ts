import path from 'path';
import globby from 'globby';
import { ComponentNotFoundInPathError } from '../../component/exceptions';
import { IgnoredDirectoryError } from './exceptions';
import { pathNormalizeToLinux } from '../../../utils/path';
import { ComponentAspectConfig } from '../../componentInfo';

export type ComponentMapFile = {
  name: string;
  relativePath: string;
  test: boolean;
};

export type Warnings = {
  alreadyUsed: Record<string, any>;
  emptyDirectory: string[];
};

export type AddResult = {
  id: string;
  files: ComponentMapFile[];
};

export type AddActionResults = {
  addedComponents: AddResult[];
  warnings: Warnings;
};

export type AddedComponent = {
  id: string;
  files: ComponentMapFile[];
  mainFile?: string;
};

// This is the context of the add operation.
// There is a possibility to execute add when the process.cwd() is different from the project directory.
// Required for determining if the paths are relative to workspace or to process.cwd().
export type AddContext<T = any> = {
  workspace: T;
  alternateCwd?: string;
};

export type AddProps = {
  componentPaths: string[];
  main?: string;
  config?: ComponentAspectConfig;
  shouldHandleOutOfSync?: boolean;
};

export class AddComponents<T> {
  workspace: T;

  componentPaths: string[];

  main: string;

  warnings: Warnings;

  gitIgnore: any;

  alternateCwd?: string;

  addedComponents: AddResult[];

  config?: ComponentAspectConfig;

  constructor(context: AddContext, addProps: AddProps) {
    this.alternateCwd = context.alternateCwd;
    this.workspace = context.workspace;
    this.componentPaths = addProps.componentPaths;
    this.main = addProps.main;
    this.config = addProps.config;
    this.warnings = {
      alreadyUsed: {},
      emptyDirectory: [],
    };
    this.addedComponents = [];
  }
}

export async function getFilesByDir(
  dir: string,
  workspacePath: string,
  gitIgnore: any
): Promise<ComponentMapFile[]> {
  const matches = await globby(dir, {
    cwd: workspacePath,
    onlyFiles: true,
  });
  if (!matches.length) throw new ComponentNotFoundInPathError(dir);
  const filteredMatches = gitIgnore.filter(matches);
  if (!filteredMatches.length) throw new IgnoredDirectoryError(dir);
  return filteredMatches.map((match: string) => {
    const normalizedPath = pathNormalizeToLinux(match);
    // the path is relative to workspace. remove the rootDir.
    const relativePath = normalizedPath.replace(`${dir}/`, '');
    return { relativePath, test: false, name: path.basename(match) };
  });
}
