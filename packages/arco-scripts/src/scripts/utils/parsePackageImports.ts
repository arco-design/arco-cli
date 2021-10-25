import fs from 'fs-extra';
import parseImport from 'parse-es-import';
import { getRealRequirePath } from '@arco-design/arco-dev-utils';

/**
 * Resolve all dependencies of an ES module for a package
 */
export default async function parsePackageImports(
  entryPath: string,
  packageName: string,
  result: string[] = [],
  parsedFileMap: { [key: string]: boolean } = {}
) {
  let entryFileContent = '';
  try {
    entryFileContent = fs.readFileSync(entryPath, 'utf8');
  } catch (error) {}

  const { imports } = await parseImport(entryFileContent);

  parsedFileMap[entryPath] = true;

  await Promise.all(
    [...imports].map(async ({ namedImports, moduleName }) => {
      if (moduleName === packageName) {
        namedImports.forEach(({ name }) => {
          if (result.indexOf(name) === -1) {
            result.push(name);
          }
        });
        return;
      }

      if (moduleName.match(/^\.{1,2}\//)) {
        const [requirePath] = getRealRequirePath(moduleName, entryPath);
        if (requirePath && !parsedFileMap[requirePath]) {
          await parsePackageImports(requirePath, packageName, result, parsedFileMap);
        }
      }
    })
  );

  return result;
}
