import path from 'path';
import fs from 'fs-extra';
import mapSeries from 'p-map-series';
import { uniqBy } from 'lodash';
import { SlotRegistry } from '@arco-cli/stone';
import { PubsubMain } from '@arco-cli/pubsub';
import { ComponentFactory, Component } from '@arco-cli/component';
import { AspectLoaderMain, getAspectDef } from '@arco-cli/aspect-loader';
import { ComponentInfo, ComponentConfig } from '@arco-cli/legacy/dist/workspace/componentInfo';
import { getFilesByDir } from '@arco-cli/legacy/dist/workspace/componentOps/addComponents';
import { getGitIgnoreForArco } from '@arco-cli/legacy/dist/utils/ignore';

import { WorkspaceConfig } from './type';
import {
  SerializableResults,
  OnComponentChange,
  OnComponentEventResult,
  OnComponentLoad,
  OnComponentAdd,
  OnComponentRemove,
} from './type/onComponentEvents';
import { Watcher } from './watch/watcher';

export type OnComponentAddSlot = SlotRegistry<OnComponentAdd>;

export type OnComponentLoadSlot = SlotRegistry<OnComponentLoad>;

export type OnComponentChangeSlot = SlotRegistry<OnComponentChange>;

export type OnComponentRemoveSlot = SlotRegistry<OnComponentRemove>;

export type WorkspaceProps = {
  path: string;
  config: WorkspaceConfig;
  pubsub: PubsubMain;
  aspectLoader: AspectLoaderMain;
  onComponentAddSlot: OnComponentAddSlot;
  onComponentLoadSlot: OnComponentLoadSlot;
  onComponentChangeSlot: OnComponentChangeSlot;
  onComponentRemoveSlot: OnComponentRemoveSlot;
};

export class Workspace implements ComponentFactory {
  static async load({
    path,
    config,
    pubsub,
    aspectLoader,
    onComponentAddSlot,
    onComponentLoadSlot,
    onComponentChangeSlot,
    onComponentRemoveSlot,
  }: WorkspaceProps): Promise<Workspace> {
    const workspace = new Workspace(
      path,
      config,
      pubsub,
      aspectLoader,
      onComponentAddSlot,
      onComponentLoadSlot,
      onComponentChangeSlot,
      onComponentRemoveSlot
    );

    await workspace.updateComponentInfo();
    return workspace;
  }

  constructor(
    public path: string,
    private config: WorkspaceConfig,
    private pubsub: PubsubMain,
    private aspectLoader: AspectLoaderMain,
    private onComponentAddSlot: OnComponentAddSlot,
    private onComponentLoadSlot: OnComponentLoadSlot,
    private onComponentChangeSlot: OnComponentChangeSlot,
    private onComponentRemoveSlot: OnComponentRemoveSlot
  ) {
    const componentConfigs = this.config.components;
    for (const c of componentConfigs) {
      c.entries = {
        ...this.config.defaultComponentEntries,
        ...c.entries,
      };
    }
    this.componentConfigList = componentConfigs;
  }

  readonly watcher = new Watcher(this, this.pubsub);

  private componentCache: Record<string, Component> = {};

  private componentInfoList: ComponentInfo[] = [];

  private componentConfigList: ComponentConfig[] = [];

  private get modulesPath() {
    return path.join(this.path, 'node_modules');
  }

  private clearComponentCache(componentId?: string) {
    if (componentId) {
      delete this.componentCache[componentId];
    } else {
      this.componentCache = {};
    }
  }

  get name() {
    return this.config.name || this.path.split('/').pop();
  }

  async updateComponentInfo(componentId?: string) {
    if (!componentId) {
      // clear component infos, and re-collect info from workspace config file
      this.componentInfoList = [];
    }

    // clear component cache, as component info may have changed
    this.clearComponentCache(componentId);

    const workspacePath = this.path;
    const infoList = this.componentInfoList;
    const gitIgnore = getGitIgnoreForArco(workspacePath);

    await Promise.all(
      this.componentConfigList.map(async (config) => {
        if (componentId && !ComponentInfo.nameMatchId(config.name, componentId)) return;

        const componentInfo = ComponentInfo.fromJson(config, workspacePath);
        if (componentId && componentId !== componentInfo.id) return;

        const rootDir = config.rootDir;
        if (rootDir) {
          try {
            componentInfo.files = await getFilesByDir(rootDir, workspacePath, gitIgnore);
          } catch (error) {
            componentInfo.files = [];
            componentInfo.noFilesError = error;
          }
        }

        const index = componentId && infoList.findIndex((info) => info.id === componentId);
        if (index) {
          infoList[index] = componentInfo;
        } else {
          infoList.push(componentInfo);
        }
      })
    );
  }

  registerOnComponentLoad(loadFn: OnComponentLoad) {
    this.onComponentLoadSlot.register(loadFn);
    return this;
  }

  registerOnComponentAdd(onComponentAddFunc: OnComponentAdd) {
    this.onComponentAddSlot.register(onComponentAddFunc);
    return this;
  }

  registerOnComponentChange(onComponentChangeFunc: OnComponentChange) {
    this.onComponentChangeSlot.register(onComponentChangeFunc);
    return this;
  }

  registerOnComponentRemove(onComponentRemoveFunc: OnComponentRemove) {
    this.onComponentRemoveSlot.register(onComponentRemoveFunc);
    return this;
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

    if (!componentInfo) {
      this.clearComponentCache(id);
      return null;
    }

    if (this.componentCache[id]) {
      return this.componentCache[id];
    }

    const component = await Component.loadFromFileSystem(componentInfo, this.path);
    const onComponentLoadTasks = this.onComponentLoadSlot
      .toArray()
      .map(async ([extension, onLoad]) => {
        const data = await onLoad(component);
        return component.upsertExtensionData(extension, data);
      });

    await Promise.all(onComponentLoadTasks);
    this.componentCache[id] = component;

    return component;
  }

  async getMany(ids: string[]) {
    return Promise.all(
      ids.map((id) => {
        return this.get(id);
      })
    );
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

    return uniqBy(coreAspectDefs, (def) => `${def.aspectPath}-${def.runtimePath}`);
  }

  // TODO track a new added component
  async track() {}

  toAbsolutePath(pathStr: string): string {
    if (path.isAbsolute(pathStr))
      throw new Error(`toAbsolutePath expects relative path, got ${pathStr}`);
    return path.join(this.path, pathStr);
  }

  toRelativePath(pathToCheck: string): string {
    const absolutePath = path.resolve(pathToCheck);
    return path.relative(this.path, absolutePath);
  }

  async triggerOnComponentAdd(id: string): Promise<OnComponentEventResult[]> {
    const component = await this.get(id);
    const onAddEntries = this.onComponentAddSlot.toArray();
    const results: Array<{ extensionId: string; results: SerializableResults }> = [];
    const files = component.files.map((file) => file.path);

    await mapSeries(onAddEntries, async ([extension, onAddFunc]) => {
      const onAddResult = await onAddFunc(component, files);
      results.push({ extensionId: extension, results: onAddResult });
    });

    return results;
  }

  async triggerOnComponentChange(id: string, files: string[]): Promise<OnComponentEventResult[]> {
    const component = await this.get(id);
    const onChangeEntries = this.onComponentChangeSlot.toArray();
    const results: Array<{ extensionId: string; results: SerializableResults }> = [];

    await mapSeries(onChangeEntries, async ([extension, onChangeFunc]) => {
      const onChangeResult = await onChangeFunc(component, files);
      results.push({ extensionId: extension, results: onChangeResult });
    });

    return results;
  }

  async triggerOnComponentRemove(id: string): Promise<OnComponentEventResult[]> {
    const onRemoveEntries = this.onComponentRemoveSlot.toArray();
    const results: Array<{ extensionId: string; results: SerializableResults }> = [];

    await mapSeries(onRemoveEntries, async ([extension, onRemoveFunc]) => {
      const onRemoveResult = await onRemoveFunc(id);
      results.push({ extensionId: extension, results: onRemoveResult });
    });

    return results;
  }
}
