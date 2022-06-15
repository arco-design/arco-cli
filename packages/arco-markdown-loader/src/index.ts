// Custom markdown loader
import path from 'path';
import fs from 'fs-extra';
import fm from 'front-matter';
import loaderUtils from 'loader-utils';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { ParseResult } from '@babel/parser';
import {
  jsxAttribute,
  jsxIdentifier,
  jsxElement,
  jsxOpeningElement,
  jsxClosingElement,
  stringLiteral,
  File,
  JSXElement,
  JSXIdentifier,
  JSXText,
  JSXAttribute,
} from '@babel/types';

import marked from './parser/marked';
import babelParse from './parser/babel';
import compilerDemo from './compiler/demo';
import compilerChangelog from './compiler/changelog';
import { processReactAst } from './compiler/react';
import { htmlToJsx, htmlToJsxWithHelmet, htmlToUsageJsx } from './jsx';
import { getDataFromChangelog } from './utils/getDataFromChangelog';
import parseHeaderFromMarkdown from './utils/parseHeaderFromMarkdown';
import { isObject } from './utils/is';

export interface ArcoMarkdownLoaderOptions {
  preprocess?: (string) => string;
  autoHelmet?:
    | boolean
    | {
        formatTitle: (string) => string;
      };
  demoDir?: string;
}

const PLACEHOLDER_DEMO = '%%Content%%';

function loaderForCommonDoc(ast: ParseResult<File>, attribute: JSXAttribute) {
  traverse(ast, {
    JSXElement: (_path) => {
      _path.node.openingElement.attributes.push(attribute);
      _path.stop();
    },
  });
  processReactAst(ast);
  return generate(ast).code;
}

function loaderForArcoComponentDoc(
  markdownAst: ParseResult<File>,
  markdownClassAttribute: JSXAttribute,
  markdownClassAttributeApiContainer: JSXAttribute,
  loaderOptions: ArcoMarkdownLoaderOptions
) {
  let ast;
  let lang = '';
  if (this.resourcePath) {
    const en = this.resourcePath.match('.en-US.md') ? 'en-US' : '';
    const zh = this.resourcePath.match('.zh-CN.md') ? 'zh-CN' : '';
    lang = en || zh;
  }

  try {
    ast = compilerDemo(this.context, loaderOptions, lang);
    const demoPath = path.resolve(this.context, loaderOptions.demoDir || 'demo');
    const demos = fs.readdirSync(demoPath);
    // 添加依赖项，对应的demo文件改变，触发重新编译
    demos.forEach((file) => {
      this.addDependency(`${demoPath}/${file}`);
    });
  } catch (err) {
    if (err.syscall !== 'scandir' || err.code !== 'ENOENT') {
      console.error(err);
    }
  }

  const usagePath = path.resolve(this.context, `usage/index.${lang}.md`);
  const usageExist = fs.existsSync(usagePath);

  let usageAst;
  if (usageExist) {
    const usageMd = fs.readFileSync(usagePath, 'utf8');
    this.addDependency(usagePath);
    const usageJsx = htmlToUsageJsx(marked(usageMd));
    usageAst = babelParse(usageJsx).program.body;
  }

  const usageCheck = babelParse('<span style={isUsage ? { display: "none" }: {}} />');
  const usageCheckAttribute = (usageCheck.program.body[0] as any).expression.openingElement
    .attributes[0];

  const changelogPath = path.resolve(this.context, `./__changelog__/index.${lang}.md`);
  const changelogExist = fs.existsSync(changelogPath);

  let changelog = [];
  if (changelogExist) {
    const fileContent = fs.readFileSync(changelogPath, 'utf8');
    changelog = getDataFromChangelog(fileContent);
    this.addDependency(changelogPath);
  }

  const commonImports = babelParse(`
    import { CodeBlockWrapper, CellCode, CellDemo, CellDescription, Browser, Changelog } from "arco-doc-site-components";
    import { Radio as NavRadio, Button as ChangelogBtn, Drawer as ChangelogDrawer } from "@arco-design/web-react";
    const changelog = ${JSON.stringify(changelog)};
  `).program.body;

  traverse(markdownAst, {
    JSXElement: (_path) => {
      const { value: valueOfFirstChild } = (_path.node.children[0] as JSXText) || { value: '' };
      const { name: nameOfOpeningElement } = _path.node.openingElement.name as JSXIdentifier;
      if (nameOfOpeningElement === 'p' && valueOfFirstChild === PLACEHOLDER_DEMO) {
        // 防止 markdown 样式影响组件样式，所以只给 markdown 内容添加 markdown-body 的类名
        const prevs = _path.getAllPrevSiblings();
        const nexts = _path.getAllNextSiblings();

        const prevSpan = jsxElement(
          jsxOpeningElement(jsxIdentifier('span'), [markdownClassAttribute]),
          jsxClosingElement(jsxIdentifier('span')),
          prevs.map((prev) => prev.node as JSXElement)
        );
        const nextSpan = jsxElement(
          jsxOpeningElement(jsxIdentifier('span'), [
            markdownClassAttributeApiContainer,
            usageCheckAttribute,
          ]),
          jsxClosingElement(jsxIdentifier('span')),
          nexts.map((prev) => prev.node as JSXElement)
        );

        prevs.forEach((prev) => {
          prev.remove();
        });
        nexts.forEach((next) => {
          next.remove();
        });

        _path.insertBefore([prevSpan]);
        _path.insertAfter([nextSpan]);

        const ButtonJSX = `<ChangelogBtn
            aria-label="Changelog"
            size="large"
            className="changelog-btn"
            onClick={() => setShowChangelog(true)}
          >
            {lang === 'en-US' ? 'Changelog' : '更新记录'}
          </ChangelogBtn>`;
        const DrawerJSX = `<ChangelogDrawer
            title="发版记录"
            visible={showChangelog}
            onOk={() => setShowChangelog(false)}
            onCancel={() => setShowChangelog(false)}
            width={800}
          >
            <Changelog changelog={changelog}/>
          </ChangelogDrawer>`;

        const componentJsx = usageExist
          ? `
              <>
              <div className="ac-toolbar">
                <NavRadio.Group
                  options={[
                    { label: lang === 'en-US' ? 'Component' : '组件', value: 'component' },
                    { label: lang === 'en-US' ? 'Usage' : '用法', value: 'usage' }
                  ]}
                  onChange={(value) => setIsUsage(value === 'usage')}
                  type="button"
                  value={isUsage ? 'usage' : 'component'}
                  size="large"
                />
                ${ButtonJSX}
              </div>
                
                <Usage style={!isUsage ? { display: 'none' } : {}} />
                <Component style={isUsage ? { display: 'none' } : {}} />
                ${DrawerJSX}
              </>
            `
          : `<>
            <div className="ac-toolbar">${ButtonJSX}</div>
            <Component />${DrawerJSX}</>`;

        const element = babelParse(componentJsx).program.body[0];
        _path.replaceWith(element);
        _path.stop();
      }
    },
  });

  traverse(markdownAst, {
    FunctionDeclaration: (_path) => {
      const functionName = _path.node.id && _path.node.id.name;
      if (usageAst && !functionName) {
        _path.insertBefore(usageAst);
      }
      if (ast) {
        _path.insertBefore(commonImports);
        _path.insertBefore(ast);
      }
      _path.stop();
    },
  });

  processReactAst(markdownAst);

  return generate(markdownAst).code;
}

export default function (rawContent: string) {
  const loaderOptions: ArcoMarkdownLoaderOptions = loaderUtils.getOptions(this) || {};

  if (typeof loaderOptions.preprocess === 'function') {
    rawContent = loaderOptions.preprocess(rawContent);
  }

  const {
    markdown: markdownContent,
    headerHtml,
    title,
    description,
  } = parseHeaderFromMarkdown(
    rawContent,
    isObject(loaderOptions.autoHelmet) && (loaderOptions.autoHelmet as any).formatTitle
  );

  // compile changelog
  const source = fm<{ [key: string]: any }>(markdownContent);
  const attributes = source.attributes;
  if (attributes.changelog) {
    return compilerChangelog(source.body, headerHtml);
  }

  const markdownClassAttribute = jsxAttribute(
    jsxIdentifier('className'),
    stringLiteral('markdown-body')
  );
  const markdownClassAttributeApiContainer = jsxAttribute(
    jsxIdentifier('className'),
    stringLiteral('markdown-body api-container')
  );
  const markdownAst = babelParse(
    headerHtml && loaderOptions.autoHelmet
      ? htmlToJsxWithHelmet(`${headerHtml}${marked(markdownContent)}`, title, description)
      : htmlToJsx(`${headerHtml}${marked(markdownContent)}`)
  );

  return rawContent.indexOf(PLACEHOLDER_DEMO) === -1
    ? loaderForCommonDoc.call(this, markdownAst, markdownClassAttribute)
    : loaderForArcoComponentDoc.call(
        this,
        markdownAst,
        markdownClassAttribute,
        markdownClassAttributeApiContainer,
        loaderOptions
      );
}
