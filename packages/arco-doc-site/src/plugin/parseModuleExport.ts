import fs from 'fs';
import path from 'path';
import glob from 'glob';
import parseEsImport from 'parse-es-import';

type ModuleExportInfo = {
  /** Module name */
  name;
  /** Path of module's source file */
  moduleFilePath: string;
  /** Source code of module */
  rawCode: string;
};

export type ModuleExportMap = {
  [key: string]: Array<ModuleExportInfo>;
};

/**
 * Parse exported modules of file
 */
export default function parseModuleExport({
  statsModules,
  context,
  validPaths,
  fileDependencyMap,
  needRawCode,
}: {
  statsModules: Array<{ [key: string]: any }>;
  context: string;
  validPaths: string[];
  fileDependencyMap: { [key: string]: string[] };
  needRawCode: boolean;
}): ModuleExportMap {
  const result: ModuleExportMap = {};

  if (!Object.keys(fileDependencyMap).length) {
    return result;
  }

  for (const { name, source } of statsModules) {
    const pathCurrent = path.resolve(context, name);
    const dirPathCurrent = path.dirname(pathCurrent);

    if (validPaths.indexOf(pathCurrent) === -1) {
      continue;
    }

    const moduleInfoList: ModuleExportInfo[] = [];
    const { imports, exports } = parseEsImport(source);

    for (const { type, moduleName, value } of exports) {
      switch (type) {
        case 'ExportSpecifier': {
          let pathImport = path.resolve(dirPathCurrent, value);
          if (fs.existsSync(pathImport) && fs.lstatSync(pathImport).isDirectory()) {
            pathImport = `${pathImport}/index`;
          }
          pathImport = glob.sync(`${pathImport}?(.jsx|.js|.ts|.tsx)`).pop();

          if (pathImport) {
            let rawCode = '';
            if (needRawCode) {
              try {
                rawCode = fs.readFileSync(pathImport, 'utf8');
              } catch (e) {
                rawCode = 'Failed to get demo code.';
              }
            }

            moduleInfoList.push({
              name: moduleName,
              rawCode,
              moduleFilePath: pathImport,
            });
          }
          break;
        }

        case 'FunctionDeclaration':
        case 'VariableDeclaration': {
          // Coupled with the content of the file, the content that needs to be parsed is as follows
          // import * as _DOC from 'xxx.md';
          // export const DOC = _DOC;
          let moduleFilePath = '';
          let rawCode = needRawCode ? value : '';
          for (const { starImport, defaultImport, moduleName: importModuleName } of imports) {
            if (
              moduleName === starImport.replace(/^_/, '') ||
              moduleName === defaultImport.replace(/^_/, '')
            ) {
              const [pathImport] = glob.sync(
                path.resolve(dirPathCurrent, `${importModuleName}?(.jsx|.js|.ts|.tsx)`)
              );
              if (pathImport) {
                moduleFilePath = pathImport;
                rawCode = needRawCode ? fs.readFileSync(pathImport, 'utf8') : '';
              }
              break;
            }
          }
          moduleInfoList.push({
            name: moduleName,
            rawCode,
            moduleFilePath,
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
