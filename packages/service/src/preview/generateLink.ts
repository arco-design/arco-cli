import type { ComponentMap } from '@arco-cli/aspect/dist/component';
import { toWindowsCompatiblePath } from '@arco-cli/legacy/dist/utils/path';

export type GenerateLinkOptions = {
  prefix: string;
  componentMap: ComponentMap<{ previews: string[]; previewContextProvider: string }>;
  componentMetadataMap?: ComponentMap<Record<string, any>>;
  mainModule?: string;
};

export function generateLink({
  prefix,
  mainModule,
  componentMap,
  componentMetadataMap,
}: GenerateLinkOptions): string {
  const links = componentMap
    .toArray()
    .map(
      (
        [
          component,
          { previews: previewFilePaths, previewContextProvider: previewContextProviderPath },
        ],
        index
      ) => {
        const metadata = componentMetadataMap?.getValueByComponentId(component.id) || {};
        return {
          metadata,
          componentIdentifier: component.id,
          modules: previewFilePaths.map((path, pathIdx) => ({
            varName: moduleVarName(index, pathIdx),
            resolveFrom: toWindowsCompatiblePath(path),
          })),
          contextProviderPath: toWindowsCompatiblePath(previewContextProviderPath),
        };
      }
    );

  return `
import { linkModules } from '${toWindowsCompatiblePath(
    require.resolve('./previewRuntime/preview.preview.runtime')
  )}';
${
  mainModule
    ? `import * as mainModule from '${toWindowsCompatiblePath(mainModule)}';`
    : 'const mainModule = {};'
}

linkModules('${prefix}', {
  mainModule,
  componentMap: {
${links
  // must include all components, including empty
  .map(
    (link) =>
      `    "${link.componentIdentifier}": [${link.modules
        .map((module) => `() => import('${module.resolveFrom}')`)
        .join(', ')}]`
  )
  .join(',\n')}
  },
  componentMetadataMap: {
${links
  // must include all components, including empty
  .map((link) => `    "${link.componentIdentifier}": ${JSON.stringify(link.metadata)}`)
  .join(',\n')}
  },
  componentContextProviderMap: {
${links
  .filter(({ contextProviderPath }) => contextProviderPath)
  .map(
    ({ componentIdentifier, contextProviderPath }) =>
      `    "${componentIdentifier}": () => import('${contextProviderPath}')`
  )
  .join(',\n')}
  },
});
`;
}

function moduleVarName(componentIdx: number, fileIdx: number) {
  return `file_${componentIdx}_${fileIdx}`;
}
