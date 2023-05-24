import path from 'path';
import fs from 'fs-extra';
import { toFsCompatible } from '@arco-cli/legacy/dist/utils';
import { BuildContext, BuildTask, BuildTaskResult } from '@arco-cli/service/dist/builder';
import { BUILD_TASK_NAME_DOCS, DIR_ARTIFACTS } from '@arco-cli/legacy/dist/constants';
import { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';

import { Component } from '@aspect/component';

import DocsAspect from './docs.aspect';

export type ComponentManifestMap = Record<Component['id'], Component['entries']['extraDocs']>;

export const DOCS_MANIFEST_FILENAME = 'manifest.json';
export const DOCS_ARTIFACT_DIR = path.join(DIR_ARTIFACTS, 'docs');

export class DocsTask implements BuildTask {
  readonly aspectId = DocsAspect.id;

  readonly name = BUILD_TASK_NAME_DOCS;

  constructor() {}

  async execute(context: BuildContext): Promise<BuildTaskResult> {
    const results: ComponentResult[] = [];
    // { artifactDirPath: { componentId: [{ title, entry }] } }
    const packageManifestMap: Record<string, ComponentManifestMap> = {};

    await Promise.all(
      context.components.map(async (component) => {
        const targetDirAbs = path.join(component.packageDirAbs, DOCS_ARTIFACT_DIR);
        const componentResult: ComponentResult = { id: component.id, errors: [] };

        packageManifestMap[targetDirAbs] ||= {};
        packageManifestMap[targetDirAbs][component.id] ||= [];

        await fs.remove(targetDirAbs);
        await fs.ensureDir(targetDirAbs);
        await Promise.all(
          component.entries.extraDocs.map(async ({ title, entry }) => {
            const extraDoc = component.files.find(
              (file) => file.relative === path.join(component.entries.base, entry)
            );
            if (extraDoc) {
              const targetFilename = `${toFsCompatible(component.id)}-${extraDoc.path
                .split(path.sep)
                .pop()}`;

              try {
                await fs.copyFile(extraDoc.path, path.join(targetDirAbs, targetFilename));
                const targetFileRelativePath = path.join(DOCS_ARTIFACT_DIR, targetFilename);
                packageManifestMap[targetDirAbs][component.id].push({
                  title,
                  entry: targetFileRelativePath,
                });
              } catch (err) {
                componentResult.errors.push(err);
              }
            }
          })
        );
      })
    );

    await Promise.all(
      Object.entries(packageManifestMap).map(async ([artifactDir, manifest]) => {
        await fs.writeJSON(path.join(artifactDir, DOCS_MANIFEST_FILENAME), manifest, { spaces: 2 });
      })
    );

    return { componentsResults: results };
  }
}
