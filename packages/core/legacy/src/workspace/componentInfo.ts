import fs from 'fs-extra';
import path from 'path';
import { buildPropagationPaths } from '../utils/path';
import { PACKAGE_JSON } from '../constants';

export type ComponentAspectConfig = { [aspectId: string]: Record<string, any> | '-' };

export type ComponentConfig = {
  // root dir of component, relative path to workspace
  rootDir: string;
  // name of component
  name: string;
  // entry file info of component
  entries?: {
    // component entry, relative path to root dir
    main: string;
    // style entry, relative path to root dir
    style?: string;
    // preview entry, relative path to root dir
    preview?: string;
    // jsdoc parse entry, relative path to root dir
    jsdoc?: string;
  };
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

  entries: ComponentConfig['entries'];

  rootDir: string;

  config?: ComponentAspectConfig;

  noFilesError?: Error;

  readonly packageJson: Record<string, any>;

  readonly packageDir: string;

  readonly packageDirAbs: string;

  constructor(
    { name, entries, rootDir, config }: ComponentConfig,
    workspacePath: string,
    files?: ComponentInfoFiles[]
  ) {
    this.entries = entries;
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
        this.packageDir = path.relative(workspacePath, dirPath);
        this.packageDirAbs = dirPath;
        this.packageJson = fs.readJSONSync(packageJsonPath);
        break;
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

  // test if a component name match a given component id
  // name: Button, id: library/Button => true
  // name: Tag, id: library/Button => false
  static nameMatchId(name = '', id = '') {
    return id.endsWith(`/${name}`);
  }

  static fromJson(json: ComponentConfig, workspacePath: string) {
    return new ComponentInfo(json, workspacePath);
  }
}
