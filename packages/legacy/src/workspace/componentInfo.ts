import fs from 'fs-extra';
import path from 'path';
import { buildPropagationPaths } from '../utils/path';
import { DEFAULT_TEST_FILE_PATTERNS, PACKAGE_JSON } from '../constants';

export type ComponentConfig = {
  /**
   * root dir of package source code, relative path to workspace
   */
  rootDir: string;
  /**
   * name of component
   */
  name: string;
  /**
   * author of component
   */
  author?: string;
  /**
   * labels of component
   */
  labels?: string[];
  /**
   * material group id of component
   */
  group?: number;
  /**
   * url of code repository
   */
  repository?: string;
  /**
   * url of ui resource, like a figma address
   */
  uiResource?: string;
  /**
   * additional page styles that can be added
   */
  extraStyles?: Array<{ title: string; href: string }>;
  /**
   * entry file info of component
   */
  entries: {
    /**
     * component dir. "./" by default, but in library-project this path should be "./ComponentName"
     */
    base?: string;
    /**
     * component main entry, should be path.join(rootDir, entries.base, entries.main)
     */
    main?: string;
    /**
     * main entry for component style
     */
    style?: string;
    /**
     * main entry for component preview
     */
    preview?: string;
    /**
     * file path of ContextProvider for component preview
     */
    previewContextProvider?: string;
    /**
     * entries for component TS document parsing
     */
    jsdoc?: string | string[];
    /**
     * file path pattern for unit test
     */
    testFilePatterns?: string[];
    /**
     * slot for extra document other than component preview, like document for changelog or quick-start
     */
    extraDocs?: Array<{ title: string; entry: string }>;
  };
  /**
   * whether this component is allowed to fork
   */
  forkable?:
    | boolean
    | {
        sources: string[];
      };
};

export type ComponentInfoFiles = {
  name: string;
  relativePath: string;
  test: boolean;
};

export class ComponentInfo {
  name: string;

  group: number;

  author: string;

  labels: string[];

  repository: string;

  uiResource: string;

  extraStyles: ComponentConfig['extraStyles'];

  files: ComponentInfoFiles[];

  entries: ComponentConfig['entries'];

  forkable: ComponentConfig['forkable'];

  rootDir: string;

  noFilesError?: Error;

  readonly packageJson: Record<string, any>;

  readonly packageDir: string;

  readonly packageDirAbs: string;

  constructor(
    readonly rawConfig: ComponentConfig,
    workspacePath: string,
    files?: ComponentInfoFiles[]
  ) {
    const {
      name,
      group,
      author,
      labels,
      repository,
      uiResource,
      entries,
      rootDir,
      extraStyles,
      forkable,
    } = rawConfig;

    // set entry to empty string to avoid path.resolve errors
    entries.base ||= './';
    entries.main ||= '';
    entries.style ||= '';
    entries.preview ||= '';
    entries.previewContextProvider ||= '';
    entries.jsdoc ||= '';
    entries.testFilePatterns ||= DEFAULT_TEST_FILE_PATTERNS;
    entries.extraDocs ||= [];

    this.entries = entries;
    this.rootDir = rootDir;
    this.name = name || '';
    this.labels = labels || [];
    this.files = files || [];
    this.group = group || 0;
    this.author = author || '';
    this.repository = repository || '';
    this.uiResource = uiResource || '';
    this.extraStyles = extraStyles || [];
    this.forkable = forkable || false;

    const dirsToSearchPkgJson = buildPropagationPaths(
      path.resolve(workspacePath, rootDir),
      workspacePath
    );

    for (const dirPath of dirsToSearchPkgJson) {
      const packageJsonPath = path.join(dirPath, PACKAGE_JSON);
      if (fs.existsSync(packageJsonPath)) {
        this.packageDir = path.relative(workspacePath, dirPath) || './';
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
