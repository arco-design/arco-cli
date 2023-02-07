import { dirname, sep } from 'path';
import { difference } from 'lodash';
import chalk from 'chalk';
import mapSeries from 'p-map-series';
import chokidar, { FSWatcher } from 'chokidar';
import loader from '@arco-cli/legacy/dist/cli/loader';
import logger from '@arco-cli/legacy/dist/logger/logger';
import { pathNormalizeToLinux } from '@arco-cli/legacy/dist/utils/path';
import { FILE_WORKSPACE_JSONC } from '@arco-cli/legacy/dist/constants';

import { PubsubMain } from '@aspect/pubsub';

import { WorkspaceAspect } from '../workspace.aspect';
import { OnComponentChangeEvent, OnComponentAddEvent, OnComponentRemovedEvent } from '../events';
import { Workspace } from '../workspace';
import { OnComponentEventResult } from '../type/onComponentEvents';
import { WatchQueue } from './watchQueue';

export type EventMessages = {
  onAll: () => void;
  onStart: (workspace: Workspace) => void;
  onReady: (workspace: Workspace, trackDir: Record<string, string>, verbose: boolean) => void;
  onChange: (
    files: string[],
    results: OnComponentEventResult[],
    verbose: boolean,
    duration: number,
    failureMsg: string
  ) => void;
  onAdd: (
    files: string[],
    results: OnComponentEventResult[],
    verbose: boolean,
    duration: number,
    failureMsg: string
  ) => void;
  onUnlink: (filePath: string) => void;
  onError: (error: Error) => void;
};

export type WatchOptions = {
  msgs?: EventMessages;
};

const DEBOUNCE_WAIT_MS = 100;

export class Watcher {
  private fsWatcher: FSWatcher;

  private changedFilesPerComponent: { [componentId: string]: string[] } = {};

  private watchQueue = new WatchQueue();

  private workspaceJsonChangesInProgress = false;

  constructor(
    private workspace: Workspace,
    private pubsub: PubsubMain,
    private trackDirs: { [dir: string]: string } = {},
    private verbose = false
  ) {}

  async watchAll(opts: WatchOptions) {
    const { msgs } = opts;
    const pathsToWatch = await this.getPathsToWatch();
    await this.createWatcher(pathsToWatch);
    const watcher = this.fsWatcher;

    msgs?.onStart(this.workspace);

    return new Promise((_resolve, reject) => {
      watcher.on('ready', () => {
        msgs?.onReady(this.workspace, this.trackDirs, this.verbose);
      });

      watcher.on('change', async (filePath) => {
        const startTime = new Date().getTime();
        const { files, results, debounced, failureMsg } = await this.handleChange(filePath);
        if (debounced) {
          return;
        }
        const duration = new Date().getTime() - startTime;
        msgs?.onChange(files, results, this.verbose, duration, failureMsg);
      });

      watcher.on('add', async (filePath) => {
        const startTime = new Date().getTime();
        const { files, results, debounced, failureMsg } = await this.handleChange(filePath);
        if (debounced) {
          return;
        }
        const duration = new Date().getTime() - startTime;
        msgs?.onAdd(files, results, this.verbose, duration, failureMsg);
      });

      watcher.on('unlink', async (p) => {
        msgs?.onUnlink(p);
        await this.handleChange(p);
      });

      watcher.on('error', (err) => {
        msgs?.onError(err);
        reject(err);
      });
    });
  }

  /**
   * *** DEBOUNCING ***
   * some actions trigger multiple files changes at (almost) the same time. e.g. "git pull".
   * this causes some performance and instability issues. a debouncing mechanism was implemented to help with this.
   * the way how it works is that the first file of the same component starts the execution with a delay (e.g. 200ms).
   * if, in the meanwhile, another file of the same component was changed, it won't start a new execution, instead,
   * it'll only add the file to `this.changedFilesPerComponent` prop.
   * once the execution starts, it'll delete this component-id from the `this.changedFilesPerComponent` array,
   * indicating the next file-change to start a new execution.
   *
   * implementation wise, `lodash.debounce` doesn't help here, because:
   * A) it doesn't return the results, unless "leading" option is true. here, it must be false, otherwise, it'll start
   * the execution immediately.
   * B) it debounces the method regardless the param passes to it. so it'll disregard the component-id and will delay
   * other components undesirably.
   */
  private async handleChange(filePath: string): Promise<{
    results: OnComponentEventResult[];
    files?: string[];
    failureMsg?: string;
    debounced?: boolean;
  }> {
    try {
      if (filePath.endsWith(FILE_WORKSPACE_JSONC)) {
        this.workspaceJsonChangesInProgress = true;
        const buildResults = await this.watchQueue.add(() => this.handleWorkspaceJsonChanges());
        this.workspaceJsonChangesInProgress = false;
        loader.stop();
        return { results: buildResults, files: [filePath] };
      }

      if (this.workspaceJsonChangesInProgress) {
        await this.watchQueue.onIdle();
      }

      const componentId = this.getComponentIdByPath(filePath);
      if (!componentId) {
        const failureMsg = `file ${filePath} is not part of any component, ignoring it`;
        logger.debug(failureMsg);
        loader.stop();
        return { results: [], files: [filePath], failureMsg };
      }

      if (this.changedFilesPerComponent[componentId]) {
        this.changedFilesPerComponent[componentId].push(filePath);
        loader.stop();
        return { results: [], debounced: true };
      }

      this.changedFilesPerComponent[componentId] = [filePath];
      await this.sleep(DEBOUNCE_WAIT_MS);
      const files = this.changedFilesPerComponent[componentId];
      delete this.changedFilesPerComponent[componentId];

      const buildResults = await this.watchQueue.add(() =>
        this.triggerCompChanges(componentId, files)
      );
      const failureMsg = buildResults.length
        ? undefined
        : `files ${files.join(
            ', '
          )} are inside the component ${componentId} but configured to be ignored`;
      loader.stop();
      return { results: buildResults, files, failureMsg };
    } catch (err: any) {
      const msg = `watcher found an error while handling ${filePath}`;
      logger.error(msg, err);
      logger.console(`${msg}, ${err.message}`);
      loader.stop();
      return { results: [], files: [filePath], failureMsg: err.message };
    }
  }

  private async sleep(ms: number) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async triggerCompChanges(
    componentId: string,
    files: string[]
  ): Promise<OnComponentEventResult[]> {
    await this.workspace.updateComponentInfo(componentId);
    const component = await this.workspace.get(componentId);
    const compFiles = files.filter((filePath) => {
      const isCompFile = Boolean(component.files.find((p) => p.path === filePath));
      if (!isCompFile) {
        logger.debug(
          `file ${filePath} is inside the component ${componentId.toString()} but configured to be ignored`
        );
      }
      return isCompFile;
    });
    if (!compFiles.length) {
      return [];
    }
    const buildResults = await this.executeWatchOperationsOnComponent(componentId, compFiles, true);
    return buildResults;
  }

  /**
   * if workspace.json changed, it's possible that a new component has been added. trigger onComponentAdd.
   */
  private async handleWorkspaceJsonChanges(): Promise<OnComponentEventResult[]> {
    const previousTrackDirs = { ...this.trackDirs };
    await this.setTrackDirs();
    const newDirs: string[] = difference(
      Object.keys(this.trackDirs),
      Object.keys(previousTrackDirs)
    );
    const removedDirs: string[] = difference(
      Object.keys(previousTrackDirs),
      Object.keys(this.trackDirs)
    );
    const results: OnComponentEventResult[] = [];
    if (newDirs.length) {
      this.fsWatcher.add(newDirs);
      const addResults = await mapSeries(newDirs, async (dir) =>
        this.executeWatchOperationsOnComponent(this.trackDirs[dir], [], false)
      );
      results.push(...addResults.flat());
    }
    if (removedDirs.length) {
      await this.fsWatcher.unwatch(removedDirs);
      await mapSeries(removedDirs, (dir) =>
        this.executeWatchOperationsOnRemove(previousTrackDirs[dir])
      );
    }
    return results;
  }

  private async executeWatchOperationsOnRemove(componentId: string) {
    logger.debug(`running OnComponentRemove hook for ${chalk.bold(componentId.toString())}`);
    this.pubsub.pub(WorkspaceAspect.id, this.creatOnComponentRemovedEvent(componentId.toString()));
    await this.workspace.triggerOnComponentRemove(componentId);
  }

  private async executeWatchOperationsOnComponent(
    componentId: string,
    files: string[],
    isChange = true
  ): Promise<OnComponentEventResult[]> {
    const idStr = componentId.toString();

    if (isChange) {
      logger.debug(`running OnComponentChange hook for ${chalk.bold(idStr)}`);
      this.pubsub.pub(
        WorkspaceAspect.id,
        this.creatOnComponentChangeEvent(idStr, 'OnComponentChange')
      );
    } else {
      logger.debug(`running OnComponentAdd hook for ${chalk.bold(idStr)}`);
      this.pubsub.pub(WorkspaceAspect.id, this.creatOnComponentAddEvent(idStr, 'OnComponentAdd'));
    }

    let buildResults: OnComponentEventResult[];
    try {
      buildResults = isChange
        ? await this.workspace.triggerOnComponentChange(componentId, files)
        : await this.workspace.triggerOnComponentAdd(componentId);
    } catch (err: any) {
      // do not exit the watch process on errors, just print them
      const msg = `found an issue during onComponentChange or onComponentAdd hooks`;
      logger.error(msg, err);
      logger.console(`\n${msg}: ${err.message || err}`);
      return [];
    }
    return buildResults;
  }

  private creatOnComponentRemovedEvent(idStr) {
    return new OnComponentRemovedEvent(Date.now(), idStr);
  }

  private creatOnComponentChangeEvent(idStr, hook) {
    return new OnComponentChangeEvent(Date.now(), idStr, hook);
  }

  private creatOnComponentAddEvent(idStr, hook) {
    return new OnComponentAddEvent(Date.now(), idStr, hook);
  }

  private getComponentIdByPath(filePath: string): string | null {
    const relativeFile = this.getRelativePathLinux(filePath);
    const trackDir = this.findTrackDirByFilePathRecursively(relativeFile);

    // the file is not part of any component. If it was a new component, or a new file of
    // existing component, then, handleWorkspaceJsonChanges() should deal with it.
    return trackDir ? this.trackDirs[trackDir] : null;
  }

  private getRelativePathLinux(filePath: string) {
    return pathNormalizeToLinux(this.workspace.toRelativePath(filePath));
  }

  private findTrackDirByFilePathRecursively(filePath: string): string | null {
    if (this.trackDirs[filePath]) return filePath;
    const parentDir = dirname(filePath);
    if (parentDir === filePath) return null;
    return this.findTrackDirByFilePathRecursively(parentDir);
  }

  private async createWatcher(pathsToWatch: string[]) {
    this.fsWatcher = chokidar.watch(pathsToWatch, {
      ignoreInitial: true,
      // Using the function way since the regular way not working as expected
      // See: https://github.com/paulmillr/chokidar/issues/773
      ignored: (path) => {
        // Ignore package.json temporarily since it creates endless loop since it's re-written after each build
        return path.includes(`${sep}node_modules${sep}`) || path.includes(`${sep}package.json`);
      },
      persistent: true,
      useFsEvents: false,
    });
  }

  async setTrackDirs() {
    this.trackDirs = {};
    const components = await this.workspace.list();
    components.map(async (component) => {
      this.trackDirs[component.componentDir] = component.id;
    });
  }

  private async getPathsToWatch(): Promise<string[]> {
    await this.setTrackDirs();
    const paths = [...Object.keys(this.trackDirs)];
    const pathsAbsolute = paths.map((dir) => this.workspace.toAbsolutePath(dir));
    return pathsAbsolute;
  }
}
