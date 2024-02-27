import path from 'path';
import fs, { readFileSync, writeFileSync } from 'fs-extra';
import { uniqBy, merge } from 'lodash';
import mapSeries from 'p-map-series';
import minimatch from 'minimatch';
import { parse, assign, stringify } from 'comment-json';
import { SlotRegistry } from '@arco-cli/stone';
import { AspectLoaderMain, getAspectDef } from '@arco-cli/core/dist/aspect-loader';
import { ComponentInfo, ComponentConfig } from '@arco-cli/legacy/dist/workspace/componentInfo';
import { getFilesByDir } from '@arco-cli/legacy/dist/workspace/componentOps/addComponents';
import { getGitIgnoreForArco } from '@arco-cli/legacy/dist/utils/ignore';
import { FILE_WORKSPACE_JSONC } from '@arco-cli/legacy/dist/constants';

import { PubsubMain } from '@aspect/pubsub';
import { ComponentFactory, Component } from '@aspect/component';

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
import { NoIdMatchPatternError } from './exceptions';

export type OnComponentAddSlot = SlotRegistry<OnComponentAdd>;

export type OnComponentLoadSlot = SlotRegistry<OnComponentLoad>;

export type OnComponentChangeSlot = SlotRegistry<OnComponentChange>;

export type OnComponentRemoveSlot = SlotRegistry<OnComponentRemove>;

export type WorkspaceProps = {
  path: string;
  config: WorkspaceConfig;
  configFilename: string;
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
    configFilename,
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
      configFilename,
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
    public config: WorkspaceConfig,
    private configFilename: string,
    private pubsub: PubsubMain,
    private aspectLoader: AspectLoaderMain,
    private onComponentAddSlot: OnComponentAddSlot,
    private onComponentLoadSlot: OnComponentLoadSlot,
    private onComponentChangeSlot: OnComponentChangeSlot,
    private onComponentRemoveSlot: OnComponentRemoveSlot
  ) {
    const rawComponentsConfig = this.config.components;
    if (Array.isArray(rawComponentsConfig)) {
      this.componentConfigList = rawComponentsConfig;
    } else {
      this.componentConfigList = rawComponentsConfig.members.map((rawConfig) =>
        merge({}, rawComponentsConfig.extends, rawConfig)
      );
    }
  }

  readonly watcher = new Watcher(this, this.pubsub);

  private componentCache: Record<string, Component> = {};

  private componentInfoList: ComponentInfo[] = [];

  private componentConfigList: ComponentConfig[] = [];

  private componentPattern: string = null;

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

  private filterComponentInfoList(pattern = this.componentPattern): ComponentInfo[] {
    pattern = pattern.trim();
    let filterFn: (info: ComponentInfo) => boolean;

    if (!pattern) {
      filterFn = () => true;
    } else {
      let hasUserSpecifiedRuleType = false;

      pattern.replace(/^(glob|reg|is):(.+)/, (_, type: string, value: string) => {
        hasUserSpecifiedRuleType = true;
        const rules = value.split(',');
        switch (type) {
          case 'is':
            filterFn = (info) => rules.indexOf(info.id) > -1;
            break;
          case 'glob':
            filterFn = (info) => !!rules.find((rule) => minimatch(info.id, rule));
            break;
          case 'reg':
            filterFn = (info) => !!rules.find((rule) => info.id.match(new RegExp(rule)));
            break;
          default:
        }
        return '';
      });

      if (!hasUserSpecifiedRuleType) {
        filterFn = (info) =>
          !!pattern.split(',').find((rule) =>
            // if there is a '*' in user-given string, treat it as a glob string
            rule.indexOf('*') > -1 ? minimatch(info.id, rule) : info.id.includes(rule)
          );
      }
    }

    return this.componentInfoList.filter(filterFn);
  }

  get name() {
    return this.config.name || this.path.split('/').pop();
  }

  /**
   * set component pattern for current workspace
   * componentPattern will also work for workspace.list()
   */
  setComponentPattern(pattern: string) {
    this.componentPattern = pattern;
  }

  updateWorkspaceConfigFile(aspectId: string, newConfig: any) {
    const configFilePath = path.join(this.path, this.configFilename);
    if (configFilePath.endsWith(FILE_WORKSPACE_JSONC)) {
      const config = parse(readFileSync(configFilePath, 'utf8'));
      writeFileSync(configFilePath, stringify(assign(config, { [aspectId]: newConfig }), null, 2));
    } else {
      throw new Error(`cannot update config files of this file type '${configFilePath}'`);
    }
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
        if (typeof index === 'number' && index !== -1) {
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

  async get(id: string, componentInfoList = this.componentInfoList) {
    const componentInfo = componentInfoList.find((info) => info.id === id);

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

  getMany(ids: string[] = []) {
    const filteredComponentInfoList = this.filterComponentInfoList();
    return Promise.all(ids.map((id) => this.get(id, filteredComponentInfoList)));
  }

  getManyByPattern(pattern: string, throwForNoMatch?: boolean) {
    if (!pattern) {
      return this.list();
    }

    const filteredComponentInfos = this.filterComponentInfoList(pattern);
    if (filteredComponentInfos.length) {
      return this.getMany(filteredComponentInfos.map((info) => info.id));
    }

    if (throwForNoMatch) {
      throw new NoIdMatchPatternError(pattern);
    } else {
      return this.list();
    }
  }

  // TODO modified components
  // getNewAndModified() { }

  list() {
    const ids = this.filterComponentInfoList().map((info) => info.id);
    return this.getMany(ids);
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
