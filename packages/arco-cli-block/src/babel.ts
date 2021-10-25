import { parse } from '@babel/parser';
import * as t from '@babel/types';
import generate from '@babel/generator';
import camelcase from 'camelcase';

interface ArcoProRouteConfig {
  routeCode: string;
  routeObj: {
    name: string;
    key: string;
    componentPath: string;
  };
  routeParentKey: string;
}

interface ArcoProI18nConfig {
  /**
   * Name of new page
   */
  pageName: string;
  /**
   * Locale code for the project
   */
  localCode: string;
  /**
   * The specific i18n file name, such as zh-CN en-US
   */
  localFileName: string;
}

interface ArcoProReduxConfig {
  code: string;
  pageName: string;
}

interface ArcoProMockConfig {
  code: string;
  pageName: string;
}

function parseWithBabel(code: string) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'decorators-legacy', 'typescript', 'classProperties', 'dynamicImport'],
  });
}

function getLastImportDeclIdx(list: t.Node[]) {
  let i = 0;
  while (t.isImportDeclaration(list[i])) {
    ++i;
  }
  return i;
}

function findDefaultExport(list: t.Node[]) {
  let target: t.ExportDefaultDeclaration | undefined;
  list.forEach((node) => {
    if (t.isExportDefaultDeclaration(node)) {
      target = node;
    }
  });
  return target;
}

/**
 * Find the val of the object property with key from the object expression
 */
function getValFromObjectExpression(oe: t.ObjectExpression, keyname: string) {
  let val: t.Expression | t.PatternLike | undefined;
  oe.properties.forEach((o) => {
    if (t.isObjectProperty(o) && t.isIdentifier(o.key) && o.key.name === keyname) {
      val = o.value;
    }
  });
  return val;
}

/**
 * Generate a object expression from a plain js object.
 */
function genObjectExpressionFromPlainJsObj(obj: { [key: string]: string }) {
  const list = Object.keys(obj).map((key) => {
    return t.objectProperty(t.identifier(key), t.stringLiteral(obj[key]));
  });
  return t.objectExpression(list);
}

/**
 * Handle route info for Arco Pro
 */
export function handleArcoProRoute(config: ArcoProRouteConfig) {
  const file = parseWithBabel(config.routeCode);

  let targetRouteInit: t.ArrayExpression | undefined;
  file.program.body.forEach((node) => {
    if (t.isExportNamedDeclaration(node) && t.isVariableDeclaration(node.declaration)) {
      if (
        t.isIdentifier(node.declaration.declarations[0].id) &&
        node.declaration.declarations[0].id.name === 'routes'
      ) {
        targetRouteInit = node.declaration.declarations[0].init as t.ArrayExpression;
      }
    }
  });

  if (!targetRouteInit) {
    throw new Error('No target route found.');
  }

  const tryToFindInsertPoint = (list: t.ArrayExpression, routeStr: string) => {
    let target: t.ObjectExpression | undefined;
    list.elements.forEach((oe) => {
      if (t.isObjectExpression(oe)) {
        const val = getValFromObjectExpression(oe, 'key');

        if (val && (val as t.StringLiteral).value === routeStr) {
          target = oe;
        }

        const children = getValFromObjectExpression(oe, 'children');
        if (children) {
          const findFromChildren = tryToFindInsertPoint(children as t.ArrayExpression, routeStr);

          if (findFromChildren) {
            target = oe;
          }
        }
      }
    });
    return target;
  };

  const insertPoint = tryToFindInsertPoint(targetRouteInit, config.routeParentKey);
  const newRout = genObjectExpressionFromPlainJsObj(config.routeObj);

  if (insertPoint) {
    const children = getValFromObjectExpression(insertPoint, 'children');
    if (children) {
      (children as t.ArrayExpression).elements.push(newRout);
    } else {
      insertPoint.properties.push(
        t.objectProperty(t.identifier('children'), t.arrayExpression([newRout]))
      );
    }
  } else {
    targetRouteInit.elements.push(newRout);
  }

  return generate(file).code;
}

/**
 * Handle i18n for Arco Pro
 */
export function handleArcoProI18n(config: ArcoProI18nConfig) {
  const file = parseWithBabel(config.localCode);
  const idx = getLastImportDeclIdx(file.program.body);
  const importedLocaleName = camelcase(config.pageName);
  const importSource = `../pages/${config.pageName}/locale/${config.localFileName}`;
  const newImportDecl = t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier(importedLocaleName))],
    t.stringLiteral(importSource)
  );

  file.program.body.splice(idx, 0, newImportDecl);

  const defaultExport = findDefaultExport(file.program.body);

  if (!defaultExport) {
    throw new Error('No default export module found.');
  }

  (defaultExport.declaration as t.ObjectExpression).properties.push(
    t.spreadElement(t.identifier(importedLocaleName))
  );

  return generate(file).code;
}

/**
 * Handle data mock for Arco Pro
 */
export function handleArcoProMock(config: ArcoProMockConfig) {
  const file = parseWithBabel(config.code);
  const idx = getLastImportDeclIdx(file.program.body);

  const importSource = `../pages/${config.pageName}/mock`;
  const newImportDecl = t.importDeclaration([], t.stringLiteral(importSource));

  file.program.body.splice(idx, 0, newImportDecl);

  const final = generate(file);
  return final.code;
}

function tryToFindReduxExportInterface(list: t.Node[]) {
  const exportedInterfaces = list.filter((node) => {
    return t.isExportNamedDeclaration(node) && t.isTSInterfaceDeclaration(node.declaration);
  });

  if (exportedInterfaces.length === 1) {
    return (exportedInterfaces[0] as t.ExportNamedDeclaration)
      .declaration as t.TSInterfaceDeclaration;
  }

  const findExportInterface = (list: t.Node[], id: string) => {
    let target: t.TSInterfaceDeclaration | undefined;
    list.forEach((node) => {
      if (t.isExportNamedDeclaration(node) && t.isTSInterfaceDeclaration(node.declaration)) {
        if (node.declaration.id.name === id) {
          target = node.declaration;
        }
      }
    });
    return target;
  };

  const target = findExportInterface(list, 'ReducerState');

  if (!target) {
    throw new Error("No export interface 'ReducerState' was found in 'redux/index.ts'.");
  }

  return target;
}

/**
 * Handle Redux for Arco Pro
 */
export function handleArcoProRedux(config: ArcoProReduxConfig) {
  const importedLocalName = camelcase(config.pageName);
  const exportInterfaceName = `${
    importedLocalName[0].toUpperCase() + importedLocalName.slice(1)
  }State`;

  const file = parseWithBabel(config.code);
  const idx = getLastImportDeclIdx(file.program.body);

  const importSource = `../pages/${config.pageName}/redux/reducer`;
  const newImportDecl = t.importDeclaration(
    [
      t.importDefaultSpecifier(t.identifier(importedLocalName)),
      t.importSpecifier(t.identifier(exportInterfaceName), t.identifier(exportInterfaceName)),
    ],
    t.stringLiteral(importSource)
  );

  file.program.body.splice(idx, 0, newImportDecl);

  const exportedInterface = tryToFindReduxExportInterface(file.program.body);

  exportedInterface.body.body.push(
    t.tsPropertySignature(
      t.identifier(importedLocalName),
      t.tSTypeAnnotation(t.tsTypeReference(t.identifier(exportInterfaceName)))
    )
  );

  const defaultExport = findDefaultExport(file.program.body);

  if (!defaultExport) {
    throw new Error('No default export module found.');
  }

  const args = (defaultExport.declaration as t.CallExpression).arguments;

  (args[0] as t.ObjectExpression).properties.push(
    // "shorthand" is true
    t.objectProperty(t.identifier(importedLocalName), t.identifier(importedLocalName), false, true)
  );

  const final = generate(file);
  return final.code;
}
