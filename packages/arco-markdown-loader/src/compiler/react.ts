// Use react component in markdown
import LRU from 'lru-cache';
import traverse from '@babel/traverse';
import { JSXIdentifier, JSXText } from '@babel/types';
import { nanoid } from 'nanoid';

import babelParse from '../parser/babel';

const cache = new LRU({
  max: 0,
  maxAge: 1000 * 60 * 10,
});

export function compileReact(code) {
  const id = nanoid();
  const ast = babelParse(code);

  traverse(ast, {
    Program: (_path) => {
      const body = _path.node.body;
      const imports = body.filter((b) => b.type === 'ImportDeclaration') || [];
      const expressions = body.filter((b) => b.type === 'ExpressionStatement') || [];

      cache.set(id, {
        imports,
        expressions,
      });

      _path.stop();
    },
  });

  return { id, holder: `<section>%%${id}%%</section>` };
}

export function processReactAst(contentAst) {
  // js:react expressions
  traverse(contentAst, {
    JSXElement: (_path) => {
      const { value: valueOfFirstChild } = (_path.node.children[0] as JSXText) || { value: '' };
      const { name: nameOfOpeningElement } = _path.node.openingElement.name as JSXIdentifier;
      if (nameOfOpeningElement === 'section' && /%%[0-9a-zA-Z_-]{21}%%/.test(valueOfFirstChild)) {
        const id = valueOfFirstChild.replace(/%%/g, '');
        const cacheAst = cache.get(id);
        if (cacheAst) {
          _path.replaceWith(cacheAst.expressions[0]);
          cache.set(id, { ...cacheAst, touched: true });
        }
      }
    },
  });
  // js:react imports
  cache.forEach((_, key) => {
    if (!cache.get(key).touched) {
      cache.del(key);
    }
  });
  traverse(contentAst, {
    ImportDeclaration: (_path) => {
      let allImports = [];
      cache.forEach((c) => {
        allImports = allImports.concat(c.imports);
      });
      _path.insertBefore(removeDuplicateImports(allImports));
      _path.stop();
      cache.reset();
    },
  });
}

export function removeDuplicateImports(allImports) {
  const importsMap = {
    ImportSpecifier: {},
    ImportDefaultSpecifier: {},
    ImportNamespaceSpecifier: {},
  };
  allImports.forEach((imports) => {
    const name = imports.source.value;
    const specifiers = imports.specifiers;

    specifiers.forEach((spec) => {
      if (spec.type === 'ImportSpecifier') {
        if (!importsMap.ImportSpecifier[name]) {
          importsMap.ImportSpecifier[name] = new Set();
        }
        importsMap.ImportSpecifier[name].add(spec.imported.name);
      }
      if (spec.type === 'ImportDefaultSpecifier') {
        if (!importsMap.ImportDefaultSpecifier[name]) {
          importsMap.ImportDefaultSpecifier[name] = new Set();
        }
        importsMap.ImportDefaultSpecifier[name].add(spec.local.name);
      }
      if (spec.type === 'ImportNamespaceSpecifier') {
        if (!importsMap.ImportNamespaceSpecifier[name]) {
          importsMap.ImportNamespaceSpecifier[name] = new Set();
        }
        importsMap.ImportNamespaceSpecifier[name].add(spec.local.name);
      }
    });
  });

  let importStringArr = [];
  const keysImportSpecifier = Object.keys(importsMap.ImportSpecifier);
  const keysImportDefaultSpecifier = Object.keys(importsMap.ImportDefaultSpecifier);
  const keysImportNamespaceSpecifier = Object.keys(importsMap.ImportNamespaceSpecifier);
  if (keysImportSpecifier.length) {
    importStringArr = importStringArr.concat(
      keysImportSpecifier.map(
        (k) => `import {${[...importsMap.ImportSpecifier[k]].join(',')}} from "${k}";`
      )
    );
  }
  if (keysImportDefaultSpecifier.length) {
    importStringArr = importStringArr.concat(
      keysImportDefaultSpecifier.map(
        (k) => `import ${[...importsMap.ImportDefaultSpecifier[k]]} from "${k}";`
      )
    );
  }
  if (keysImportNamespaceSpecifier.length) {
    importStringArr = importStringArr.concat(
      keysImportNamespaceSpecifier.map(
        (k) => `import * as ${[...importsMap.ImportNamespaceSpecifier[k]]} from "${k}";`
      )
    );
  }

  const ast = babelParse(importStringArr.join('\n'));
  return ast.program.body;
}
