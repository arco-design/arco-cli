import { ComponentDoc, withDefaultConfig } from 'react-docgen-typescript';
import { getRealRequirePath, print } from '@arco-design/arco-dev-utils';
import { InjectPropsParams } from './index';

const PROP_TABLE_HEADER = '|参数名|描述|类型|默认值|\n|---|:---:|:---:|---:|';

const parse = withDefaultConfig({
  propFilter: (prop) =>
    prop.parent == null || prop.parent.fileName.indexOf('node_modules/@types/react') < 0,
}).parse;

function generateTable(
  param: ComponentDoc,
  mainComponent: string,
  index: number,
  attributes: Record<string, any>,
  currentFile: string
) {
  // Type: <<xx>>
  // DefaultValue: [[xx]]
  const regex = /^(.+?)(?:<<(.*?)>>)?(?:\[\[(.*?)]])?$/;
  const { displayName, props } = param;
  const { noparent, nobrackets, notitle } = attributes;

  const tableContent = Object.keys(props)
    .filter((propName) => {
      const { name, description } = props[propName];
      return description || ['className', 'style', 'disabled', 'children'].indexOf(name) > -1;
    })
    .map((propName) => {
      const { defaultValue, description, name, required, type } = props[propName];
      const descriptionMatches = regex.exec(description) || [];
      const getType = () =>
        `\`${(descriptionMatches[2] || type.name).replace(/\|/g, '\\|')}\`${
          required ? ' **(必填)**' : ''
        }`;
      const getDefaultValue = () =>
        `\`${descriptionMatches[3] || (defaultValue && defaultValue.value) || '-'}\``;

      const getDescription = () => {
        switch (name) {
          case 'className':
            return description || '节点类名';
          case 'style':
            return description || '节点样式';
          case 'children':
            return description || '子节点';
          case 'disabled':
            return description || '是否禁用';
          case 'defaultValue':
            return description || '默认值';
          default:
            return descriptionMatches[1] || description;
        }
      };

      return `|${name}|${getDescription()}|${getType()}|${getDefaultValue()}|`;
    });

  let tableTitle;
  if (noparent && noparent.split(',').indexOf(currentFile) !== -1) {
    tableTitle = displayName;
  } else {
    tableTitle = index > 0 ? `${mainComponent}.${displayName}` : displayName;
  }
  if (!nobrackets || nobrackets.split(',').indexOf(currentFile) === -1) {
    tableTitle = `<${tableTitle}>`;
  }

  return `
${notitle ? '' : `### \`${tableTitle}\``}
${param.description ? `\n${param.description}\n` : ''}
${PROP_TABLE_HEADER}
${tableContent.join('\n')}
  `;
}

export default function withReactDocgen({
  currentDir,
  attributes,
  markdownBody,
  placeholder,
}: InjectPropsParams): string {
  let mainComponent;
  const parseFiles = attributes.file ? attributes.file.split(',') : [];
  const propsTables = [];

  parseFiles.forEach((file, index) => {
    const [entryFilePath] = getRealRequirePath(file, currentDir);

    if (!entryFilePath) {
      print.error(['arco-scripts'], `Invalid entry path [${file}] for docgen`);
      return;
    }

    const [param] = parse(entryFilePath);
    if (!param) {
      print.warn(['arco-scripts'], `No property parse in [${entryFilePath}]`);
      return;
    }

    mainComponent = mainComponent || param.displayName;
    propsTables.push(generateTable(param, mainComponent, index, attributes, file));
  });

  return markdownBody.replace(placeholder, propsTables.length ? propsTables.join('\n\n') : '');
}
