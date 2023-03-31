import fs from 'fs-extra';
import { join, resolve, basename, dirname } from 'path';
import { Component } from '@arco-cli/aspect/dist/component';
import { flatten, isEmpty, chunk } from 'lodash';
import { toFsCompatible } from '@arco-cli/legacy/dist/utils';
import type {
  BundlerResult,
  BundlerContext,
  Asset,
  BundlerEntryMap,
  EntriesAssetsMap,
  Target,
} from '@arco-cli/aspect/dist/bundler';
import type { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';
import {
  toComponentChunkId,
  toComponentChunkFileName,
} from '@arco-cli/legacy/dist/workspace/componentIdTo';

import { ARTIFACTS_DIR } from '@service/builder';

import { BundlingStrategy, ComputeTargetsContext } from '../bundlingStrategy';
import type { PreviewDefinition } from '../types';
import type { ComponentPreviewMetaData, PreviewMain } from '../preview.main.runtime';
import { generatePreviewBundleEntry } from './generatePreviewBundleEntry';
import { PreviewOutputFileNotFoundError } from '../exceptions';

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

    fs.removeSync(cacheDir);
    fs.ensureDirSync(outputPath);

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
    // const componentPath = resolve(
    //   context.workspace.path,
    //   component.componentDir,
    //   component.entries.main
    // );
    const chunks = {
      componentPreview: toComponentChunkId(component.id, 'preview'),
      // TODO build component UMD dist files
      // component: context.splitComponentBundle ? component.id : undefined,
    };
    const entries = {
      [chunks.componentPreview]: {
        filename: toComponentChunkFileName(component.id, 'preview'),
        import: componentPreviewPath,
        library: { name: chunks.componentPreview, type: 'umd' },
      },
    };

    // if (chunks.component) {
    //   entries[chunks.component] = {
    //     filename: this.getComponentChunkFileName(component.id, 'component'),
    //     import: componentPath,
    //     library: { name: chunks.component, type: 'umd' },
    //   };
    // }

    return { component, entries };
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

  private async copyAssetsToArtifacts(context: BundlerContext, result: BundlerResult) {
    // components may share the same artifact dir
    // old artifacts should be cleaned up before copy task starting
    await Promise.all(
      context.components.map(async (component) => {
        await fs.remove(join(component.packageDirAbs, this.artifactDir));
      })
    );

    return Promise.all(
      context.components.map(async (component) => {
        const files = this.findAssetsForComponent(
          component,
          result.assets,
          result.entriesAssetsMap || {}
        );

        if (!files) return;

        const artifactDirFullPath = join(component.packageDirAbs, this.artifactDir);

        await Promise.all(
          files.map(async (asset) => {
            const filePath = this.getAssetAbsolutePath(context, asset);
            if (!fs.existsSync(filePath)) {
              throw new PreviewOutputFileNotFoundError(component.id, filePath);
            }
            const destFilePath = join(artifactDirFullPath, this.getAssetFilename(asset));
            await fs.ensureDir(dirname(destFilePath));
            await fs.copyFile(filePath, destFilePath);
          })
        );
      })
    );
  }

  private findAssetsForComponent(
    component: Component,
    assets: Asset[],
    entriesAssetsMap: EntriesAssetsMap
  ): Asset[] | undefined {
    if (!assets) return undefined;

    const componentEntryId = component.id;
    const componentPreviewEntryId = toComponentChunkId(component.id, 'preview');
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
      await this.copyAssetsToArtifacts(context, result);
    }

    const componentsResults: ComponentResult[] = result.components.map((component) => {
      const metadata = this.computeComponentMetadata(result, component);
      return {
        id: component.id,
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

      const previewPaths = previewFiles.map((file) => file.path);
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
    const filenamePrefix = `preview.${toFsCompatible(component.id)}`;

    return this.preview.writeBuildEntry(contents, this.getCacheDir(context), filenamePrefix);
  }
}
