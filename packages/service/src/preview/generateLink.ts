import type { ComponentMap } from '@arco-cli/aspect/dist/component';
import { toWindowsCompatiblePath } from '@arco-cli/legacy/dist/utils/path';

export type GenerateLinkOptions = {
  prefix: string;
  componentMap: ComponentMap<string[]>;
  componentMetadataMap?: ComponentMap<Record<string, any>>;
  mainModule?: string;
};

export function generateLink({
  prefix,
  mainModule,
  componentMap,
  componentMetadataMap,
}: GenerateLinkOptions): string {
  const links = componentMap.toArray().map(([component, filePaths], compIdx) => {
    const metadata = componentMetadataMap?.getValueByComponentId(component.id) || {};
    return {
      componentIdentifier: component.id,
      modules: filePaths.map((path, pathIdx) => ({
        varName: moduleVarName(compIdx, pathIdx),
        resolveFrom: toWindowsCompatiblePath(path),
      })),
      metadata,
    };
  });

  return `
import { linkModules } from '${toWindowsCompatiblePath(
    require.resolve('./previewRuntime/preview.preview.runtime')
  )}';
${
  mainModule
    ? `import * as mainModule from '${toWindowsCompatiblePath(mainModule)}';`
    : 'const mainModule = {};'
}

${links
  .map((link) =>
    link.modules
      .map((module) => `import * as ${module.varName} from "${module.resolveFrom}";`)
      .join('\n')
  )
  .filter((line) => line !== '') // prevent empty lines
  .join('\n')}

linkModules('${prefix}', {
  mainModule,
  componentMap: {
${links
  // must include all components, including empty
  .map(
    (link) =>
      `    "${link.componentIdentifier}": [${link.modules
        .map((module) => module.varName)
        .join(', ')}]`
  )
  .join(',\n')}
  },
  componentMetadataMap: {
${links
  // must include all components, including empty
  .map((link) => `    "${link.componentIdentifier}": ${JSON.stringify(link.metadata)}`)
  .join(',\n')}
  }
});
`;
}

function moduleVarName(componentIdx: number, fileIdx: number) {
  return `file_${componentIdx}_${fileIdx}`;
}
