import visit from 'unist-util-visit';
import { detectiveEs6 } from '@arco-cli/legacy/dist/workspace/component/dependencies/detectives';

import type { ImportSpecifier } from '../importSpecifier';

export function extractImports() {
  return function transformer(tree, file) {
    visit(tree, 'import', (node: any) => {
      const es6Import = detectiveEs6(node.value);
      const imports: ImportSpecifier[] = Object.keys(es6Import).flatMap((dep) => {
        if (!es6Import[dep].importSpecifiers) {
          return {
            fromModule: dep,
          };
        }
        return es6Import[dep].importSpecifiers.map((importSpecifier) => ({
          fromModule: dep,
          identifier: importSpecifier.name,
          isDefault: importSpecifier.isDefault,
        }));
      });
      (file.data.imports ||= []).push(...imports);
    });
  };
}
