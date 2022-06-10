// compile demo folder
import template from '@babel/template';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { Node, transformFromAstSync } from '@babel/core';
import {
  identifier,
  jsxAttribute,
  jsxElement,
  jsxIdentifier,
  jsxOpeningElement,
  jsxClosingElement,
  jsxMemberExpression,
  jsxExpressionContainer,
  stringLiteral,
  templateLiteral,
  templateElement,
  variableDeclarator,
  variableDeclaration,
  JSXElement,
} from '@babel/types';

import getMeta from '../getMeta';
import marked from '../parser/marked';
import babelParse from '../parser/babel';
import { dangerouslySetInnerHTMLToJsx } from '../jsx';

const linkSvg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="4">
<path d="M14.1006 25.4142L9.15084 30.3639C6.8077 32.7071 6.8077 36.5061 9.15084 38.8492C11.494 41.1924 15.293 41.1924 17.6361 38.8492L26.1214 30.3639C28.4646 28.0208 28.4645 24.2218 26.1214 21.8786M33.8996 22.5858L38.8493 17.636C41.1925 15.2929 41.1925 11.4939 38.8493 9.15072C36.5062 6.80758 32.7072 6.80758 30.364 9.15072L21.8788 17.636C19.5356 19.9792 19.5356 23.7781 21.8788 26.1213" stroke-linecap="butt"></path>
</svg>`;

// const components = [
//   'Icon',
//   'Button',
//   'Link',
//   'Typography',
//   'Grid',
//   'Divider',
//   'Layout',
//   'Space',
//   'Avatar',
//   'Badge',
//   'Calendar',
//   'Card',
//   'Collapse',
//   'Comment',
//   'Descriptions',
//   'Empty',
//   'List',
//   'Statistic',
//   'Tabs',
//   'Table',
//   'Tag',
//   'Timeline',
//   'Tooltip',
//   'Popover',
//   'Carousel',
//   'Tree',
//   'Image',
//   'DatePicker',
//   'TimePicker',
//   'Input',
//   'InputNumber',
//   'AutoComplete',
//   'Checkbox',
//   'Radio',
//   'Rate',
//   'Switch',
//   'Select',
//   'TreeSelect',
//   'Cascader',
//   'Slider',
//   'Form',
//   'Upload',
//   'Transfer',
//   'Mentions',
//   'Alert',
//   'Drawer',
//   'Message',
//   'Notification',
//   'Popconfirm',
//   'Progress',
//   'Result',
//   'Spin',
//   'Modal',
//   'Skeleton',
//   'Breadcrumb',
//   'Dropdown',
//   'Menu',
//   'PageHeader',
//   'Pagination',
//   'Steps',
//   'ConfigProvider',
//   'Affix',
//   'Anchor',
//   'BackTop',
//   'Trigger',
//   'ResizeBox',
//   'div',
//   'span',
// ];

// 获取代码简短展示
// function getShortAst(returnElement) {
//   let shortCodeOriginAst;
//   let shortCodePreviewAst;

//   const name = returnElement.openingElement.name.name;
//   const selfClosing = returnElement.openingElement.selfClosing;

//   if (!selfClosing || (components.indexOf(name) > -1 && selfClosing)) {
//     const processCode = generate(returnElement).code;
//     const num = processCode.split('\n').length;
//     if (num <= 10) {
//       shortCodeOriginAst = babelParse(
//         dangerouslySetInnerHTMLToJsx(marked(`\`\`\`js\n${processCode}\n\`\`\``))
//       );
//     }

//     if (shortCodeOriginAst) {
//       traverse(shortCodeOriginAst, {
//         JSXElement: (_path) => {
//           shortCodePreviewAst = _path.node;
//           _path.stop();
//         },
//       });
//     }
//     return shortCodePreviewAst;
//   }
// }

export default function compileDemo(context, options, lang) {
  const babelConfig = options.babelConfig || {};
  const metadata = getMeta(context, options, lang);

  /** ********************** */
  const demoList = [];
  metadata
    .filter((meta) => !meta.attributes.skip)
    .forEach((meta, index) => {
      if (!meta.jsCode) {
        return false;
      }

      const { title, description } = meta.attributes;

      const markedBodyAddHeader = `<h2 class="ac-demo-title"><a tabindex="-1" href="#${title}">${linkSvg}</a>${title}</h2>${
        description && marked(description)
      }`;
      const descriptionOriginAst = babelParse(dangerouslySetInnerHTMLToJsx(markedBodyAddHeader));
      const codeOriginAst = babelParse(
        dangerouslySetInnerHTMLToJsx(marked(`\`\`\`js\n${meta.jsCode}\n\`\`\``))
      );
      let cssCodeOriginAst;
      if (meta.cssCode) {
        cssCodeOriginAst = babelParse(
          dangerouslySetInnerHTMLToJsx(marked(`\`\`\`css\n${meta.cssCode}\n\`\`\``))
        );
      }
      let codePreviewBlockAst;
      let cssCodePreviewBlockAst;
      let descriptionAst;
      let tsCodePreviewBlockAst;
      const codeAttrs = [];

      // 存疑
      if (meta.tsCode) {
        const tsCodeAst = babelParse(
          dangerouslySetInnerHTMLToJsx(marked(`\`\`\`js\n${meta.tsCode}\n\`\`\``))
        );
        traverse(tsCodeAst, {
          JSXElement: (_path) => {
            tsCodePreviewBlockAst = _path.node;
            _path.stop();
          },
        });
        codeAttrs.push(jsxAttribute(jsxIdentifier('tsx'), tsCodePreviewBlockAst));
      }
      if (meta.cssCode) {
        codeAttrs.push(jsxAttribute(jsxIdentifier('cssCode'), stringLiteral(meta.cssCode)));
      }
      traverse(descriptionOriginAst, {
        JSXElement: (_path) => {
          descriptionAst = _path.node;
          _path.stop();
        },
      });
      traverse(codeOriginAst, {
        JSXElement: (_path) => {
          codePreviewBlockAst = _path.node;
          _path.stop();
        },
      });
      if (cssCodeOriginAst) {
        traverse(cssCodeOriginAst, {
          JSXElement: (_path) => {
            cssCodePreviewBlockAst = _path.node;
            _path.stop();
          },
        });
      }
      // 插入到代码块的第一行
      const ast = babelParse(meta.jsCode);

      traverse(ast, {
        CallExpression(_path) {
          const callee = _path.node.callee as any;
          if (
            callee.object &&
            callee.object.name === 'ReactDOM' &&
            callee.property.name === 'render'
          ) {
            const returnElement = _path.node.arguments[0] as JSXElement;
            const demoElement = meta.attributes.browser
              ? jsxElement(
                  jsxOpeningElement(jsxIdentifier('Browser'), []),
                  jsxClosingElement(jsxIdentifier('Browser')),
                  [returnElement]
                )
              : returnElement;
            const demoCellElement = jsxElement(
              jsxOpeningElement(jsxIdentifier('CellDemo'), []),
              jsxClosingElement(jsxIdentifier('CellDemo')),
              [demoElement]
            );
            // 源代码块
            const children = [codePreviewBlockAst];
            // 处理 css 代码，展示 + 插入 style 标签到 dom
            if (meta.cssCode) {
              const subIdentifier = jsxMemberExpression(
                jsxIdentifier('CellCode'),
                jsxIdentifier('Css')
              );
              const cssCodeCellElement = jsxElement(
                jsxOpeningElement(subIdentifier, []),
                jsxClosingElement(subIdentifier),
                [cssCodePreviewBlockAst]
              );
              children.push(cssCodeCellElement);
              // 如果是 css:silent，那么只展示而不插入 style 标签，避免出现多重 style 相互覆盖
              if (!meta.cssSilent) {
                const styleElement = jsxElement(
                  jsxOpeningElement(jsxIdentifier('style'), []),
                  jsxClosingElement(jsxIdentifier('style')),
                  [
                    jsxExpressionContainer(
                      templateLiteral(
                        [templateElement({ raw: meta.cssCode, cooked: meta.cssCode })],
                        []
                      )
                    ),
                  ]
                );
                children.push(styleElement);
              }
            }
            // const shortCodePreviewAst = getShortAst(returnElement);
            // if (shortCodePreviewAst) {
            //   const subIdentifier = t.jsxMemberExpression(
            //     t.jsxIdentifier('CellCode'),
            //     t.jsxIdentifier('Short')
            //   );
            //   const shortCodeCellElement = t.jsxElement(
            //     t.jsxOpeningElement(subIdentifier, []),
            //     t.jsxClosingElement(subIdentifier),
            //     [shortCodePreviewAst]
            //   );
            //   children.push(shortCodeCellElement);
            // }
            const codeCellElement = jsxElement(
              jsxOpeningElement(jsxIdentifier('CellCode'), codeAttrs),
              jsxClosingElement(jsxIdentifier('CellCode')),
              children
            );
            // 展开全部代码按钮
            const cellDescriptionProps = [];
            if (index === 0) {
              cellDescriptionProps.push(jsxAttribute(jsxIdentifier('isFirst')));
            }
            const descriptionCellElement = jsxElement(
              jsxOpeningElement(jsxIdentifier('CellDescription'), cellDescriptionProps),
              jsxClosingElement(jsxIdentifier('CellDescription')),
              [descriptionAst]
            );
            const codeBlockElement = jsxElement(
              jsxOpeningElement(jsxIdentifier('CodeBlockWrapper'), [
                jsxAttribute(jsxIdentifier('id'), stringLiteral(title)),
              ]),
              jsxClosingElement(jsxIdentifier('CodeBlockWrapper')),
              [descriptionCellElement, demoCellElement, codeCellElement]
            );
            const app = variableDeclaration('const', [
              variableDeclarator(identifier('__export'), codeBlockElement),
            ]);
            _path.insertBefore(app);
            _path.remove();
          }
        },
      });
      const { code } = transformFromAstSync(ast, null, babelConfig);
      const buildRequire = template(`
        const NAME = React.memo(() => {
          AST
          return __export;
        })
      `);

      const finalAst = buildRequire({
        NAME: `Demo${index}`,
        AST: code,
      });

      demoList.push(generate(finalAst as Node).code);
    });

  const buildRequire = template(`
    CODE
    class Component extends React.Component {
      render() {
        return React.createElement('span', { className: 'arco-components-wrapper', style: this.props.style }, ${demoList
          .map((_, index) => `React.createElement(Demo${index}, { key: ${index} })`)
          .join(',')});
      }
    }
  `);

  return buildRequire({
    CODE: demoList.join('\n'),
  });
}
