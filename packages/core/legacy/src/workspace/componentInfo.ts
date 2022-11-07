import fs from 'fs-extra';
import path from 'path';
import { buildPropagationPaths } from '../utils/path';
import { PACKAGE_JSON } from '../constants';

export type ComponentAspectConfig = { [aspectId: string]: Record<string, any> | '-' };

export type ComponentConfig = {
  rootDir: string;
  mainFile: string;
  mainStyleFile?: string;
  config: ComponentAspectConfig;
};

export type ComponentInfoFiles = {
  name: string;
  relativePath: string;
  test: boolean;
};

export class ComponentInfo {
  name: string;

  files: ComponentInfoFiles[];

  mainFile: string;

  mainStyleFile?: string;

  rootDir: string;

  config?: ComponentAspectConfig;

  noFilesError?: Error;

  readonly packageJson: Record<string, any>;

  readonly packageJsonPath: string;

  constructor(
    { mainFile, mainStyleFile, rootDir, config }: ComponentConfig,
    name: string,
    workspacePath: string,
    files?: ComponentInfoFiles[]
  ) {
    this.mainFile = mainFile;
    this.mainStyleFile = mainStyleFile;
    this.rootDir = rootDir;
    this.config = config;
    this.name = name || '';
    this.files = files || [];

    const dirsToSearchPkgJson = buildPropagationPaths(
      path.resolve(workspacePath, rootDir),
      workspacePath
    );

    for (const dirPath of dirsToSearchPkgJson) {
      const packageJsonPath = path.join(dirPath, PACKAGE_JSON);
      if (fs.existsSync(packageJsonPath)) {
        this.packageJsonPath = path.relative(packageJsonPath, workspacePath);
        this.packageJson = fs.readJSONSync(packageJsonPath);
      }
    }
  }

  get id(): string {
    return this.packageName ? `${this.packageName}/${this.name}` : this.name;
  }

  get version(): string {
    return this.packageJson?.version || '';
  }

  get packageName(): string {
    return this.packageJson?.name || '';
  }

  get dependencies(): Record<string, string> {
    return this.packageJson?.dependencies || {};
  }

  get devDependencies(): Record<string, string> {
    return this.packageJson?.devDependencies || {};
  }

  get peerDependencies(): Record<string, string> {
    return this.packageJson?.peerDependencies || {};
  }

  static fromJson(json: ComponentConfig, name: string, workspacePath: string) {
    return new ComponentInfo(json, name, workspacePath);
  }
}
