import { parse } from 'path';
import { camelCase } from 'lodash';
import { AspectDefinition } from '@arco-cli/core/dist/aspect-loader';
import { toWindowsCompatiblePath } from '@arco-cli/legacy/dist/utils/path';
import { UIAspect } from './ui.aspect';

export type CreateRootOptions = {
  aspectDefs: AspectDefinition[];
  config?: object;
  runtimeName?: string;
  rootAspect?: string;
  rootExtensionName?: string;
};

export async function createRoot({
  aspectDefs,
  rootExtensionName,
  rootAspect = UIAspect.id,
  runtimeName = 'ui',
  config = {},
}: CreateRootOptions) {
  const rootId = rootExtensionName ? `'${rootExtensionName}'` : '';
  const identifiers = getIdentifiers(aspectDefs, 'Aspect');
  const idSetters = getIdSetters(aspectDefs, 'Aspect');

  config['arco.app/arco'] = rootExtensionName;

  // Escaping "'" in case for example in the config you have something like:
  // description: "team's scope"
  const stringifiedConfig = toWindowsCompatiblePath(JSON.stringify(config)).replace(/'/g, "\\'");

  return `
${createImports(aspectDefs)}

const config = JSON.parse('${stringifiedConfig}');

${idSetters.join('\n')}

export default function render(...props){
  return Stone.load([${identifiers.join(', ')}], '${runtimeName}', config)
    .then((stone) => {
      return stone
      .run()
      .then(() => stone.get('${rootAspect}'))
      .then((rootExtension) => {
        return rootExtension.render(${rootId}, ...props);
      })
      .catch((err) => {
        throw err;
      });
    });
}

render();
`;
}

function createImports(aspectDefs: AspectDefinition[]) {
  const defs = aspectDefs.filter((def) => def.runtimePath);

  return `import { Stone } from '@arco-cli/stone';
${getImportStatements(aspectDefs, 'aspectPath', 'Aspect')}
${getImportStatements(defs, 'runtimePath', 'Runtime')}`;
}

function getImportStatements(
  aspectDefs: AspectDefinition[],
  pathProp: string,
  suffix: string
): string {
  return aspectDefs
    .map(
      (aspectDef) =>
        `import ${getIdentifier(aspectDef, suffix)} from '${toWindowsCompatiblePath(
          aspectDef[pathProp]
        )}';`
    )
    .join('\n');
}

function getIdentifiers(aspectDefs: AspectDefinition[], suffix: string): string[] {
  return aspectDefs.map((aspectDef) => `${getIdentifier(aspectDef, suffix)}`);
}

function getIdSetters(defs: AspectDefinition[], suffix: string) {
  return defs
    .map((def) => def.id && `${getIdentifier(def, suffix)}.id = '${def.id}';`)
    .filter((val) => !!val);
}

function getIdentifier(aspectDef: AspectDefinition, suffix: string): string {
  if (!aspectDef.local) {
    return getCoreIdentifier(aspectDef.aspectPath, suffix);
  }
  return getRegularAspectIdentifier(aspectDef, suffix);
}

function getRegularAspectIdentifier(aspectDef: AspectDefinition, suffix: string): string {
  return camelCase(
    `${parse(aspectDef.aspectPath).base.replace(/\./, '__').replace('@', '__')}${suffix}`
  );
}

function getCoreIdentifier(path: string, suffix: string): string {
  return camelCase(`${parse(path).name.split('.')[0]}${suffix}`);
}
