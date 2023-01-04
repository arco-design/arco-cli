import { join } from 'path';
import fs from 'fs-extra';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { MainRuntime } from '@arco-cli/cli';
import { DIR_CACHE_ROOT } from '@arco-cli/legacy/dist/constants';
import { BundlerAspect, BundlerMain, Asset } from '@arco-cli/bundler';
import { UIAspect, UIMain } from '@arco-cli/ui';
import { ExecutionContext, PreviewEnv } from '@arco-cli/envs';
import { AspectDefinition } from '@arco-cli/aspect-loader';
import { Workspace, WorkspaceAspect } from '@arco-cli/workspace';
import { PubsubAspect, PubsubMain } from '@arco-cli/pubsub';
import { Component } from '@arco-cli/component';
import { BuilderAspect, BuilderMain } from '@arco-cli/builder';
import { sha1 } from '@arco-cli/legacy/dist/utils';

import PreviewAspect, { PreviewRuntime } from './preview.aspect';
import { PreviewStartPlugin } from './preview.startPlugin';
import { ExecutionRef } from './executionRef';
import { PreviewDefinition } from './types';
import { generateLink } from './generateLink';
import { PreviewTask } from './preview.task';
import { BundlingStrategy } from './bundlingStrategy';
import { COMPONENT_PREVIEW_STRATEGY_NAME, ComponentBundlingStrategy } from './strategies';
import { BundlingStrategyNotFoundError } from './exceptions';

const DEFAULT_CACHE_DIR = join(DIR_CACHE_ROOT, PreviewAspect.id);

export type PreviewStrategyName = 'env' | 'component';

export type EnvPreviewConfig = {
  strategyName?: PreviewStrategyName;
  splitComponentBundle?: boolean;
};

export type PreviewConfig = {
  bundlingStrategy?: string;
  disabled: boolean;
  /**
   * limit concurrent components when running the bundling step for your bundler during generate components preview task.
   * this helps mitigate large memory consumption for the build pipeline. This may increase the overall time for the generate-preview task, but reduce memory footprint.
   * default - no limit.
   */
  maxChunkSize?: number;
};

export type ComponentPreviewSizedFile = Asset;

export type ComponentPreviewSize = {
  files: ComponentPreviewSizedFile[];
  assets: ComponentPreviewSizedFile[];
  totalFiles: number;
  compressedTotalFiles?: number;
  totalAssets: number;
  compressedTotalAssets?: number;
  total: number;
  compressedTotal?: number;
};

export type ComponentPreviewMetaData = {
  size?: ComponentPreviewSize;
};

export type PreviewDefinitionSlot = SlotRegistry<PreviewDefinition>;

export class PreviewMain {
  static runtime = MainRuntime;

  static dependencies = [WorkspaceAspect, UIAspect, BundlerAspect, PubsubAspect, BuilderAspect];

  static slots = [Slot.withType<PreviewDefinition>()];

  static provider(
    [workspace, uiMain, bundler, pubsub, builder]: [
      Workspace,
      UIMain,
      BundlerMain,
      PubsubMain,
      BuilderMain
    ],
    config: PreviewConfig,
    [previewSlot]: [PreviewDefinitionSlot]
  ) {
    const preview = new PreviewMain(config, workspace, uiMain, previewSlot);

    if (workspace) {
      uiMain.registerStartPlugin(new PreviewStartPlugin(workspace, bundler, pubsub));
    }

    builder.registerBuildTasks([new PreviewTask(preview)]);

    bundler.registerTarget({
      entry: preview.getPreviewTarget.bind(preview),
    });

    return preview;
  }

  constructor(
    public config: PreviewConfig,
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

  private getDefaultStrategies() {
    return [new ComponentBundlingStrategy(this)];
  }

  private async resolveAspects(runtimeName?: string): Promise<AspectDefinition[]> {
    const root = this.getUi()[1];
    runtimeName = runtimeName || MainRuntime.name;
    const resolvedAspects = await root.resolveAspects(runtimeName);
    return resolvedAspects;
  }

  private updateLinkFiles(context: ExecutionContext, components: Component[] = []) {
    const previews = this.previewSlot.values();
    const paths = previews.map(async (previewDef) => {
      const dirPath = join(this.cacheDir, context.id);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const prefix = previewDef.prefix;
      const templatePath = await previewDef.renderTemplatePath?.(context.env);
      const componentMap = (await previewDef.getModuleMap(components)).map((files) => {
        return files.map((file) => file.path);
      });
      const componentMetadataMap = await previewDef.getMetadataMap?.(components, context.env);

      const contents = generateLink({
        prefix,
        componentMap,
        mainModule: templatePath,
        componentMetadataMap,
      });
      const hash = sha1(contents);
      const targetPath = join(dirPath, `${prefix}-${this.timestamp}.js`);

      // write only if link has changed (prevents triggering fs watches)
      if (this.writeHash.get(targetPath) !== hash) {
        fs.writeFileSync(targetPath, contents);
        this.writeHash.set(targetPath, hash);
      }

      return targetPath;
    });

    return Promise.all(paths);
  }

  // TODO handle component change and update file entry
  // private handleComponentChange() {
  //   // this.updateLinkFiles();
  // }

  getDefs(): PreviewDefinition[] {
    return this.previewSlot.values();
  }

  getEnvPreviewConfig(env?: PreviewEnv): EnvPreviewConfig {
    return typeof env?.getPreviewConfig === 'function' ? env.getPreviewConfig() : {};
  }

  getBundlingStrategy(env?: PreviewEnv): BundlingStrategy {
    const strategies = this.getDefaultStrategies();
    const envPreviewConfig = this.getEnvPreviewConfig(env);
    const strategyFromEnv = envPreviewConfig?.strategyName;
    const strategyName =
      strategyFromEnv || this.config.bundlingStrategy || COMPONENT_PREVIEW_STRATEGY_NAME;
    const selected = strategies.find((strategy) => {
      return strategy.name === strategyName;
    });

    if (!selected) throw new BundlingStrategyNotFoundError(strategyName);

    return selected;
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

  writeBuildEntry(contents: string, targetDir: string, prefix: string) {
    const hash = sha1(contents);
    const targetPath = join(targetDir, `${prefix}-${this.timestamp}.js`);

    // TODO clear cache before preview
    // write only if link has changed (prevents triggering fs watches)
    if (this.writeHash.get(targetPath) !== hash) {
      fs.writeFileSync(targetPath, contents);
      this.writeHash.set(targetPath, hash);
    }

    return targetPath;
  }
}

PreviewAspect.addRuntime(PreviewMain);
