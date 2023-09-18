import path from 'path';
import fs from 'fs-extra';
import { toFsCompatible } from '@arco-cli/legacy/dist/utils';
import { BuildContext, BuildTask, BuildTaskResult } from '@arco-cli/service/dist/builder';
import { BUILD_TASK_NAME_DOCS, DIR_ARTIFACTS_DOCS } from '@arco-cli/legacy/dist/constants';
import { toComponentManifestFilename } from '@arco-cli/legacy/dist/workspace/componentIdTo';
import { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';
import type { Doclet } from '@arco-cli/legacy/dist/types';

import { Component } from '@aspect/component';

import DocsAspect from './docs.aspect';
import type { DocsMain } from './docs.main.runtime';
import type { DocSnippet } from '../docs/type';

export type ComponentManifest = {
  doclets: Doclet[];
  snippets: DocSnippet[];
  extraDocs: Component['entries']['extraDocs'];
};

export class DocsTask implements BuildTask {
  readonly aspectId = DocsAspect.id;

  readonly name = BUILD_TASK_NAME_DOCS;

  constructor(
    /**
     * docs extension.
     */
    private docsMain: DocsMain
  ) {}

  async execute(context: BuildContext): Promise<BuildTaskResult> {
    const results: ComponentResult[] = [];
    // { artifactDirPath: { componentId: { ... } } }
    const packageManifestMap: Map<Component, ComponentManifest> = new Map();

    // remove docs artifacts dir at first
    await Promise.all(
      [...new Set(context.components.map(({ packageDirAbs }) => packageDirAbs))].map(
        async (packagePathAbs) => {
          await fs.remove(path.join(packagePathAbs, DIR_ARTIFACTS_DOCS));
        }
      )
    );

    // collect component doclets and snippets
    const componentMetadataMap = this.docsMain.getMetadata(
      context.components,
      context.envRuntime.env
    );

    // 从 context.env 获取 component metadata
    await Promise.all(
      context.components.map(async (component) => {
        const componentResult: ComponentResult = { id: component.id, errors: [] };
        let manifest: ComponentManifest = packageManifestMap.get(component);
        if (!manifest) {
          manifest = { doclets: [], snippets: [], extraDocs: [] };
          packageManifestMap.set(component, manifest);
        }

        // handle snippets/doclets bellow
        try {
          const doclets = componentMetadataMap.getValueByComponentId(component.id);
          const doc = this.docsMain.getDoc(component);
          manifest.doclets.push(...doclets);
          manifest.snippets.push(...doc.snippets);
        } catch (err) {
          componentResult.errors.push(err);
        }

        // handle extraDocs bellow
        await Promise.all(
          component.entries.extraDocs.map(async ({ title, entry }) => {
            const extraDoc = component.files.find(
              (file) =>
                file.relative === path.relative('./', path.join(component.entries.base, entry))
            );
            if (extraDoc) {
              const targetFilename = `${toFsCompatible(component.id)}-${extraDoc.path
                .split(path.sep)
                .pop()}`;

              try {
                const targetDirAbs = path.join(component.packageDirAbs, DIR_ARTIFACTS_DOCS);
                await fs.ensureDir(targetDirAbs);
                await fs.copyFile(extraDoc.path, path.join(targetDirAbs, targetFilename));
                const targetFileRelativePath = path.join(DIR_ARTIFACTS_DOCS, targetFilename);
                manifest.extraDocs.push({
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
      [...packageManifestMap.entries()].map(async ([component, manifest]) => {
        const targetDir = path.join(component.packageDirAbs, DIR_ARTIFACTS_DOCS);
        const manifestFilename = toComponentManifestFilename(component.id);
        await fs.ensureDir(targetDir);
        await fs.writeJSON(path.join(targetDir, manifestFilename), manifest, { spaces: 2 });
      })
    );

    return { componentsResults: results };
  }
}
