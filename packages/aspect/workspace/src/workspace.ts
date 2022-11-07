import path from 'path';
import fs from 'fs-extra';
import { uniqBy } from 'lodash';
import { ComponentFactory, Component } from '@arco-cli/component';
import { AspectLoaderMain, getAspectDef } from '@arco-cli/aspect-loader';
import { ComponentInfo } from '@arco-cli/legacy/dist/workspace/componentInfo';
import { getFilesByDir } from '@arco-cli/legacy/dist/workspace/componentOps/addComponents';
import { getGitIgnoreForArco } from '@arco-cli/legacy/dist/utils/ignore';
import { WorkspaceConfig } from './type';

export type WorkspaceProps = {
  path: string;
  config: WorkspaceConfig;
  aspectLoader: AspectLoaderMain;
};

export class Workspace implements ComponentFactory {
  public path: string;

  private config: WorkspaceConfig;

  private aspectLoader: AspectLoaderMain;

  private componentInfoList: ComponentInfo[] = [];

  static async load(props: WorkspaceProps): Promise<Workspace> {
    const workspace = new Workspace(props);
    const workspacePath = workspace.path;
    const gitIgnore = getGitIgnoreForArco(workspacePath);
    await Promise.all(
      Object.entries(workspace.componentConfigMap).map(async ([name, config]) => {
        const componentInfo = ComponentInfo.fromJson(config, name, workspacePath);
        const rootDir = config.rootDir;
        if (rootDir) {
          try {
            componentInfo.files = await getFilesByDir(rootDir, workspacePath, gitIgnore);
          } catch (error) {
            componentInfo.files = [];
            componentInfo.noFilesError = error;
          }
        }
        workspace.componentInfoList.push(componentInfo);
      })
    );

    return workspace;
  }

  constructor({ path, config, aspectLoader }: WorkspaceProps) {
    this.path = path;
    this.config = config;
    this.aspectLoader = aspectLoader;
  }

  private get modulesPath() {
    return path.join(this.path, 'node_modules');
  }

  get componentConfigMap() {
    return this.config.components || {};
  }

  get name() {
    return this.config.name || this.path.split('/').pop();
  }

  /**
   * Provides a cache folder, unique per key.
   * Return value may be undefined, if workspace folder is unconventional (bare-scope, no node_modules, etc)
   */
  getCacheDir(
    /*
     * unique key, i.e. aspect or component id
     */
    id: string
  ) {
    const PREFIX = 'arco-cli';
    const cacheDir = path.join(this.modulesPath, '.cache', PREFIX, id);

    // maybe should also check it's a folder and has write permissions
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    return cacheDir;
  }

  async get(id: string) {
    const componentInfo = this.componentInfoList.find((info) => info.id === id);
    return componentInfo ? Component.loadFromFileSystem(componentInfo, this.path) : null;
  }

  async getMany(ids: string[]) {
    const components = await Promise.all(
      ids.map(async (id) => {
        const component = await this.get(id);
        return component;
      })
    );
    return components;
  }

  async getManyByPattern(_pattern: string, _throwForNoMatch?: boolean) {
    // TODO pattern
    return this.list();
  }

  async getNewAndModified() {
    // TODO modified components
    return this.list();
  }

  async list() {
    const ids = this.componentInfoList.map((info) => info.id);
    const components = await this.getMany(ids);
    return components;
  }

  async resolveAspects(runtimeName: string) {
    const coreAspectIds = this.aspectLoader.getCoreAspectIds();
    let coreAspectDefs = await Promise.all(
      coreAspectIds.map(async (coreId) => {
        const rawDef = await getAspectDef(coreId, runtimeName);
        return this.aspectLoader.loadDefinition(rawDef);
      })
    );

    if (runtimeName) {
      coreAspectDefs = coreAspectDefs.filter(({ runtimePath }) => runtimePath);
    }

    const uniqDefs = uniqBy(coreAspectDefs, (def) => `${def.aspectPath}-${def.runtimePath}`);

    return uniqDefs;
  }

  // TODO track a new added component
  async track() {}
}
