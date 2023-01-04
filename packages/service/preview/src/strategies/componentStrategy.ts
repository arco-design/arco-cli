import { join, resolve, basename, dirname } from 'path';
import { existsSync, ensureDirSync, copyFileSync, removeSync } from 'fs-extra';
import { Component } from '@arco-cli/component';
import { flatten, isEmpty, chunk } from 'lodash';
import { Compiler } from '@arco-cli/compiler';
import { toFsCompatible } from '@arco-cli/legacy/dist/utils';
import { ARTIFACTS_DIR, ComponentResult } from '@arco-cli/builder';
import type {
  BundlerResult,
  BundlerContext,
  Asset,
  BundlerEntryMap,
  EntriesAssetsMap,
  Target,
} from '@arco-cli/bundler';
import { BundlingStrategy, ComputeTargetsContext } from '../bundlingStrategy';
import type { PreviewDefinition } from '../types';
import type { ComponentPreviewMetaData, PreviewMain } from '../preview.main.runtime';
import { generatePreviewBundleEntry } from './generatePreviewBundleEntry';
import { PreviewOutputFileNotFoundError } from '../exceptions';

export const PREVIEW_CHUNK_SUFFIX = 'preview';
export const COMPONENT_CHUNK_SUFFIX = 'component';
export const PREVIEW_CHUNK_FILENAME_SUFFIX = `${PREVIEW_CHUNK_SUFFIX}.js`;
export const COMPONENT_CHUNK_FILENAME_SUFFIX = `${COMPONENT_CHUNK_SUFFIX}.js`;

export const COMPONENT_STRATEGY_SIZE_KEY_NAME = 'size';
export const COMPONENT_STRATEGY_ARTIFACT_NAME = 'preview-component';

type ComponentEntry = {
  component: Component;
  entries: Record<string, any>;
};

/**
 * bundles all components in a given env into the same bundle.
 */
export class ComponentBundlingStrategy implements BundlingStrategy {
  name = 'component';

  constructor(private preview: PreviewMain) {}

  get artifactDir() {
    return join(ARTIFACTS_DIR, 'preview');
  }

  async computeTargets(
    context: ComputeTargetsContext,
    previewDefs: PreviewDefinition[]
  ): Promise<Target[]> {
    const cacheDir = this.getCacheDir(context);
    const outputPath = this.getOutputPath(context);

    removeSync(cacheDir);
    ensureDirSync(outputPath);

    const entriesArr = await Promise.all(
      context.components.map((component) => {
        return this.computeComponentEntry(previewDefs, component, context);
      }, {})
    );
    const chunkSize = this.preview.config.maxChunkSize;
    const chunks = chunkSize ? chunk(entriesArr, chunkSize) : [entriesArr];

    return chunks.map((currentChunk) => {
      const entries: BundlerEntryMap = {};
      const components: Component[] = [];
      currentChunk.forEach((entry) => {
        Object.assign(entries, entry.entries);
        components.push(entry.component);
      });

      return {
        entries,
        components,
        outputPath,
      };
    });
  }

  async computeResults(context: BundlerContext, results: BundlerResult[]) {
    const componentsResults = flatten(
      await Promise.all(results.map((result) => this.computeTargetResult(context, result)))
    );

    const artifacts = [
      {
        name: COMPONENT_STRATEGY_ARTIFACT_NAME,
        globPatterns: ['**'],
        rootDir: this.artifactDir,
      },
    ];

    return {
      componentsResults,
      artifacts,
    };
  }

  private async computeComponentEntry(
    previewDefs: PreviewDefinition[],
    component: Component,
    context: ComputeTargetsContext
  ): Promise<ComponentEntry> {
    const componentPreviewPath = await this.computePaths(previewDefs, context, component);
    const [componentPath] = this.getPaths(context, component, [component.mainFile]);
    const chunks = {
      componentPreview: this.getComponentChunkId(component.id, 'preview'),
      component: context.splitComponentBundle ? component.id : undefined,
    };
    const fsCompatibleId = toFsCompatible(component.id);

    const entries = {
      [chunks.componentPreview]: {
        filename: this.getComponentChunkFileName(fsCompatibleId, 'preview'),
        import: componentPreviewPath,
        library: { name: chunks.componentPreview, type: 'umd' },
      },
    };

    if (chunks.component) {
      entries[chunks.component] = {
        filename: this.getComponentChunkFileName(fsCompatibleId, 'component'),
        import: componentPath,
        library: { name: chunks.component, type: 'umd' },
      };
    }

    return { component, entries };
  }

  private getComponentChunkId(componentId: string, type: 'component' | 'preview') {
    return type === 'component' ? componentId : `${componentId}-${PREVIEW_CHUNK_SUFFIX}`;
  }

  private getComponentChunkFileName(idstr: string, type: 'component' | 'preview') {
    const suffix =
      type === 'component' ? COMPONENT_CHUNK_FILENAME_SUFFIX : PREVIEW_CHUNK_FILENAME_SUFFIX;
    return `${idstr}-${suffix}`;
  }

  private getCacheDir(context: ComputeTargetsContext) {
    const capsulesDir = context.workspace.getCacheDir('capsules');
    const envName = context.id.replace('/', '__');
    return resolve(`${capsulesDir}/${envName}-preview`);
  }

  private getOutputPath(context: ComputeTargetsContext) {
    return resolve(`${this.getCacheDir(context)}/output`);
  }

  private getAssetAbsolutePath(context: BundlerContext, asset: Asset): string {
    const path = this.getOutputPath(context);
    return join(path, 'public', this.getAssetFilename(asset));
  }

  private getAssetFilename(asset: Asset): string {
    // handle cases where the asset name is something like my-image.svg?hash (while the filename in the fs is just my-image.svg)
    const [name] = asset.name.split('?');
    return name;
  }

  private getPaths(
    context: ComputeTargetsContext,
    component: Component,
    fileRelativePaths: string[]
  ) {
    const compiler: Compiler = context.env.getCompiler();
    return fileRelativePaths.map((file) =>
      join(component.packageDirAbs, compiler.getDistPathBySrcPath(file))
    );
  }

  private copyAssetsToCapsules(context: BundlerContext, result: BundlerResult) {
    context.components.forEach((component) => {
      const files = this.findAssetsForComponent(
        component,
        result.assets,
        result.entriesAssetsMap || {}
      );

      if (!files) return;

      const artifactDirFullPath = join(component.packageDirAbs, this.artifactDir);
      ensureDirSync(artifactDirFullPath);

      files.forEach((asset) => {
        const filePath = this.getAssetAbsolutePath(context, asset);
        if (!existsSync(filePath)) {
          throw new PreviewOutputFileNotFoundError(component.id, filePath);
        }
        const destFilePath = join(artifactDirFullPath, this.getAssetFilename(asset));
        ensureDirSync(dirname(destFilePath));
        copyFileSync(filePath, destFilePath);
      });
    });
  }

  private findAssetsForComponent(
    component: Component,
    assets: Asset[],
    entriesAssetsMap: EntriesAssetsMap
  ): Asset[] | undefined {
    if (!assets) return undefined;

    const componentEntryId = component.id;
    const componentPreviewEntryId = this.getComponentChunkId(component.id, 'preview');
    const componentFiles = entriesAssetsMap[componentEntryId]?.assets || [];
    const componentAuxiliaryFiles = entriesAssetsMap[componentEntryId]?.auxiliaryAssets || [];
    const componentPreviewFiles = entriesAssetsMap[componentPreviewEntryId]?.assets || [];
    const componentPreviewAuxiliaryFiles =
      entriesAssetsMap[componentPreviewEntryId]?.auxiliaryAssets || [];

    return componentFiles
      .concat(componentAuxiliaryFiles)
      .concat(componentPreviewFiles)
      .concat(componentPreviewAuxiliaryFiles);
  }

  private computeComponentMetadata(
    result: BundlerResult,
    component: Component
  ): ComponentPreviewMetaData {
    const componentEntryId = component.id;

    if (!result?.entriesAssetsMap || !result?.entriesAssetsMap[componentEntryId]) {
      return {};
    }

    const files = (result.entriesAssetsMap[componentEntryId]?.assets || []).map((file) => {
      return {
        name: basename(file.name),
        size: file.size,
        compressedSize: file.compressedSize,
      };
    });
    const filesTotalSize = result.entriesAssetsMap[componentEntryId]?.assetsSize || 0;
    const compressedTotalFiles =
      result.entriesAssetsMap[componentEntryId]?.compressedAssetsSize || 0;
    const assets = (result.entriesAssetsMap[componentEntryId]?.auxiliaryAssets || []).map(
      (file) => {
        return {
          name: basename(file.name),
          size: file.size,
          compressedSize: file.compressedSize,
        };
      }
    );
    const assetsTotalSize = result.entriesAssetsMap[componentEntryId]?.auxiliaryAssetsSize || 0;
    const compressedTotalAssets =
      result.entriesAssetsMap[componentEntryId]?.compressedAuxiliaryAssetsSize || 0;
    const totalSize = filesTotalSize + assetsTotalSize;
    const compressedTotal = compressedTotalFiles + compressedTotalAssets;

    return {
      [COMPONENT_STRATEGY_SIZE_KEY_NAME]: {
        files,
        assets,
        totalFiles: filesTotalSize,
        totalAssets: assetsTotalSize,
        total: totalSize,
        compressedTotalFiles,
        compressedTotalAssets,
        compressedTotal,
      },
    };
  }

  private async computeTargetResult(context: BundlerContext, result: BundlerResult) {
    if (isEmpty(result.errors)) {
      // In case there are errors files will not be emitted so trying to copy them will fail anyway
      this.copyAssetsToCapsules(context, result);
    }

    const componentsResults: ComponentResult[] = result.components.map((component) => {
      const metadata = this.computeComponentMetadata(result, component);
      return {
        component,
        metadata,
        errors: result.errors.map((err) => (typeof err === 'string' ? err : err.message)),
        warning: result.warnings,
        startTime: result.startTime,
        endTime: result.endTime,
      };
    });

    return componentsResults;
  }

  private async computePaths(
    defs: PreviewDefinition[],
    context: ComputeTargetsContext,
    component: Component
  ): Promise<string> {
    const moduleMapsPromise = defs.map(async (previewDef) => {
      const previewFiles = (await previewDef.getModuleMap([component])).getValueByComponentId(
        component.id
      );

      if (!previewFiles) {
        return { prefix: previewDef.prefix, previewPaths: [] };
      }

      const previewPaths = this.getPaths(
        context,
        component,
        previewFiles.map((file) => file.relative)
      );
      const renderPath = await previewDef.renderTemplatePath?.(context.env);
      const metadata = (
        await previewDef.getMetadataMap([component], context.env)
      ).getValueByComponentId(component.id);

      return {
        prefix: previewDef.prefix,
        previewPaths,
        renderPath,
        metadata,
      };
    });

    const moduleMaps = await Promise.all(moduleMapsPromise);
    const contents = generatePreviewBundleEntry(moduleMaps);

    return this.preview.writeBuildEntry(contents, this.getCacheDir(context), 'preview');
  }
}
