import fs from 'fs';
import path from 'path';
import glob from 'glob';
import parseEsImport from 'parse-es-import';

type ModuleExportInfo = {
  /** Module name */
  name;
  /** Source code of module */
  value: string;
  /** Imported modules it depends on */
  dependencies: Array<{
    key?: string;
    path: string;
    rawCode: string;
  }>;
};

export type ModuleExportInfoMap = {
  /** key is file path, value is list of exported module info */
  [key: string]: Array<ModuleExportInfo>;
};

/**
 * Parse exported modules of file
 */
export default function parseModuleExport({
  statsModules,
  context,
  validPaths,
}: {
  statsModules: Array<{ [key: string]: any }>;
  context: string;
  validPaths: string[];
}): ModuleExportInfoMap {
  const result: ModuleExportInfoMap = {};

  for (const { name } of statsModules) {
    const pathCurrent = path.resolve(context, name);
    const dirPathCurrent = path.dirname(pathCurrent);

    if (validPaths.indexOf(pathCurrent) === -1) {
      continue;
    }

    const moduleInfoList: ModuleExportInfo[] = [];
    const { imports, exports } = parseEsImport(fs.readFileSync(pathCurrent, 'utf8'));

    const moduleImported: Array<{ name: string; path: string }> = imports
      .map(({ starImport, defaultImport, moduleName: importModuleName }) => {
        const [pathImport] = glob.sync(
          path.resolve(dirPathCurrent, `${importModuleName}?(.jsx|.js|.ts|.tsx)`)
        );
        return {
          name: starImport || defaultImport,
          path: pathImport,
        };
      })
      .filter((module) => module.path);

    for (const { type, moduleName, value, identifierList, identifierTree } of exports) {
      switch (type) {
        case 'ExportSpecifier': {
          let pathImport = path.resolve(dirPathCurrent, value);
          if (fs.existsSync(pathImport) && fs.lstatSync(pathImport).isDirectory()) {
            pathImport = `${pathImport}/index`;
          }
          pathImport = glob.sync(`${pathImport}?(.jsx|.js|.ts|.tsx)`).pop();

          if (pathImport) {
            let rawCode = '';
            try {
              rawCode = fs.readFileSync(pathImport, 'utf8');
            } catch (e) {
              rawCode = 'Failed to get demo code.';
            }

            moduleInfoList.push({
              name: moduleName,
              value,
              dependencies: [
                {
                  path: pathImport,
                  rawCode,
                },
              ],
            });
          }
          break;
        }

        case 'FunctionDeclaration':
        case 'VariableDeclaration': {
          // Coupled with the content of the file, the content that needs to be parsed is as follows
          // import * as _Component from '../../Component/demo/index.js';
          // import * as _ComponentDoc from '../../Component/README.md';
          // export const Component = { ..._Component, SITE_DOC: _ComponentDoc };
          const dependencies: ModuleExportInfo['dependencies'] = [];

          if (identifierList.length) {
            identifierList.forEach((identifier) => {
              const importFrom = moduleImported.find(({ name }) => name === identifier);
              if (importFrom) {
                let key = identifierList.length > 1 ? identifier : null;

                Object.entries(identifierTree || {}).forEach(([_key, value]) => {
                  if (value === identifier) {
                    key = _key;
                  }
                });

                dependencies.push({
                  key,
                  path: importFrom.path,
                  rawCode: fs.readFileSync(importFrom.path, 'utf8'),
                });
              }
            });
          }

          moduleInfoList.push({
            name: moduleName,
            value,
            dependencies,
          });
          break;
        }

        default:
          break;
      }
    }

    result[pathCurrent] = moduleInfoList;
  }

  return result;
}
