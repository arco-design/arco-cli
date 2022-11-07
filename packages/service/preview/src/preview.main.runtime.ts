import { join } from 'path';
import fs from 'fs-extra';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { MainRuntime } from '@arco-cli/cli';
import { DIR_CACHE_ROOT } from '@arco-cli/legacy/dist/constants';
import { BundlerAspect, BundlerMain } from '@arco-cli/bundler';
import { UIAspect, UIMain } from '@arco-cli/ui';
import { ExecutionContext } from '@arco-cli/envs';
import { AspectDefinition } from '@arco-cli/aspect-loader';
import { Workspace, WorkspaceAspect } from '@arco-cli/workspace';
import { PubsubAspect, PubsubMain } from '@arco-cli/pubsub';
import { Component, ComponentMap } from '@arco-cli/component';
import { sha1 } from '@arco-cli/legacy/dist/utils';

import PreviewAspect, { PreviewRuntime } from './preview.aspect';
import { PreviewStartPlugin } from './preview.startPlugin';
import { ExecutionRef } from './executionRef';
import { PreviewDefinition } from './types';
import { generateLink } from './generateLink';

const DEFAULT_CACHE_DIR = join(DIR_CACHE_ROOT, PreviewAspect.id);

export type PreviewDefinitionSlot = SlotRegistry<PreviewDefinition>;

export class PreviewMain {
  static runtime = MainRuntime;

  static dependencies = [WorkspaceAspect, UIAspect, BundlerAspect, PubsubAspect];

  static slots = [Slot.withType<PreviewDefinition>()];

  static provider(
    [workspace, uiMain, bundler, pubsub]: [Workspace, UIMain, BundlerMain, PubsubMain],
    _config,
    [previewSlot]: [PreviewDefinitionSlot]
  ) {
    const preview = new PreviewMain(workspace, uiMain, previewSlot);

    if (workspace) {
      uiMain.registerStartPlugin(new PreviewStartPlugin(workspace, bundler, pubsub));
    }

    bundler.registerTarget({
      entry: preview.getPreviewTarget.bind(preview),
    });

    return preview;
  }

  constructor(
    private workspace: Workspace | undefined,
    private ui: UIMain,
    private previewSlot: PreviewDefinitionSlot
  ) {}

  get cacheDir(): string {
    return this.workspace?.getCacheDir(PreviewAspect.id) || DEFAULT_CACHE_DIR;
  }

  private executionRefs = new Map<string, ExecutionRef>();

  private writeHash = new Map<string, string>();

  private timestamp = Date.now();

  private getUi() {
    const ui = this.ui.getUi();
    if (!ui) throw new Error('ui not found');
    return ui;
  }

  private async getPreviewTarget(
    /** execution context (of the specific env) */
    context: ExecutionContext
  ): Promise<string[]> {
    // store context for later link-file updates
    // also register related envs that this context is acting on their behalf
    [context.id, ...context.relatedContexts].forEach((ctxId) => {
      this.executionRefs.set(ctxId, new ExecutionRef(context));
    });

    const previewRuntime = await this.writePreviewRuntime();
    const linkFiles = await this.updateLinkFiles(context, context.components);

    return [...linkFiles, previewRuntime];
  }

  private async resolveAspects(runtimeName?: string): Promise<AspectDefinition[]> {
    const root = this.getUi()[1];
    runtimeName = runtimeName || MainRuntime.name;
    const resolvedAspects = await root.resolveAspects(runtimeName);
    return resolvedAspects;
  }

  /**
   * write a link to load custom modules dynamically.
   */
  private writeLink(
    prefix: string,
    moduleMap: ComponentMap<string[]>,
    defaultModule: string | undefined,
    dirName: string
  ) {
    const contents = generateLink(prefix, moduleMap, defaultModule);
    const hash = sha1(contents);
    const targetPath = join(dirName, `${prefix}-${this.timestamp}.js`);

    // write only if link has changed (prevents triggering fs watches)
    if (this.writeHash.get(targetPath) !== hash) {
      fs.writeFileSync(targetPath, contents);
      this.writeHash.set(targetPath, hash);
    }

    return targetPath;
  }

  private updateLinkFiles(context: ExecutionContext, components: Component[] = []) {
    const previews = this.previewSlot.values();
    const paths = previews.map(async (previewDef) => {
      const templatePath = await previewDef.renderTemplatePath?.(context.env);
      const map = await previewDef.getModuleMap(components);
      const withPaths = map.map<string[]>((files) => {
        return files.map((file) => file.path);
      });

      const dirPath = join(this.cacheDir, context.id);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      return this.writeLink(previewDef.prefix, withPaths, templatePath, dirPath);
    });

    return Promise.all(paths);
  }

  registerDefinition(previewDef: PreviewDefinition) {
    this.previewSlot.register(previewDef);
  }

  async writePreviewRuntime() {
    const [name] = this.getUi();
    const resolvedAspects = await this.resolveAspects(PreviewRuntime.name);
    const filePath = await this.ui.generateRoot({
      aspectDefs: resolvedAspects,
      runtimeName: PreviewRuntime.name,
      rootAspect: PreviewAspect.id,
      rootExtensionName: name,
    });
    return filePath;
  }
}

PreviewAspect.addRuntime(PreviewMain);
