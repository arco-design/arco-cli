import { toWindowsCompatiblePath } from '@arco-cli/legacy/dist/utils/path';

export type ModuleVar = {
  prefix: string;
  previewPaths: string[];
  renderPath?: string;
  metadata?: unknown;
};

export function generatePreviewBundleEntry(modules: ModuleVar[]): string {
  const previews = modules.map(({ prefix, previewPaths }) => {
    return {
      name: prefix,
      entries: previewPaths.map((path, idx) => ({
        path: toWindowsCompatiblePath(path),
        importedName: `${prefix}_${idx}`,
      })),
    };
  });

  const renders = modules
    .filter(({ renderPath }) => renderPath)
    .map(({ prefix, renderPath }) => {
      return {
        name: prefix,
        entry: {
          path: toWindowsCompatiblePath(renderPath),
          importedName: `${prefix}_render`,
        },
      };
    });

  // import per preview file
  const importPreviewStr: string = previews
    .map(({ entries }) =>
      entries
        .map(({ path, importedName }) => `import * as ${importedName} from '${path}'`)
        .join(';\n')
    )
    .join(';\n');

  // import per render function file
  const importRenderStr: string = renders
    .map(({ entry: { path, importedName } }) => `import ${importedName} from '${path}'`)
    .join(';\n');

  // export files group per preview
  const exportsString: string = previews
    .map(
      ({ name, entries }) =>
        `export const ${name} = [${entries.map((entry) => entry.importedName).join(', ')}]`
    )
    .concat(renders.map(({ name, entry }) => `export const ${name}Render = ${entry.importedName}`))
    .join(';\n');

  const exportsMetadataString: string = modules
    .filter(({ metadata }) => metadata)
    .map(({ prefix, metadata }) => `export const ${prefix}Metadata = ${JSON.stringify(metadata)}`)
    .join(';\n');

  return `${importPreviewStr};
  
${importRenderStr}

${exportsString};

${exportsMetadataString};
`;
}
