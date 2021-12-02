import { DIR_NAME_COMPONENT_LIBRARY, DIR_NAME_DEMO, FILENAME_README } from '../constant';
import getConfigProcessor from '../scripts/utils/getConfigProcessor';

type APIParseTools = 'ts-document' | 'react-docgen-typescript';

export type DocgenConfig = {
  /**
   * Filename of template
   * @zh 模板文件名
   * @default TEMPLATE.md
   */
  template: string;
  /**
   * Glob of entry directory path fo generate document
   * @zh 需生成文档目录的 Glob 匹配符
   * @default components/*
   */
  entry: string;
  /**
   * Directory path for output file
   * @zh 生成文档的目录路径
   * @default ''
   */
  output: string;
  /**
   * Filename of output file
   * @zh 生成文档的文件名
   * @default README.md
   */
  outputFileName: string;
  /**
   * Glob of component demos
   * @zh 组件 Demo 的 Glob 匹配符
   * @default demo/*.{jsx,tsx}
   */
  demoGlob: string;
  /**
   * Tools to parse typescript
   * @zh 用于解析 TypeScript 的工具
   * @default ['react-docgen-typescript', {}]
   */
  tsParseTool: [APIParseTools, Record<string, any> | Array<any>];
  /**
   * Target language
   * @zh 生成文档的目标语言
   * @default 'zh-CN'
   */
  languages: Array<'zh-CN' | 'en-US'>;
};

/**
 * Language placeholder in file name configuration
 */
export const DOCGEN_LANGUAGE_PLACEHOLDER_IN_FILENAME = '[language]';

let config: DocgenConfig = {
  template: 'TEMPLATE.md',
  entry: `${DIR_NAME_COMPONENT_LIBRARY}/*`,
  output: '',
  outputFileName: FILENAME_README,
  demoGlob: `${DIR_NAME_DEMO}/*.{jsx,tsx}`,
  tsParseTool: ['react-docgen-typescript', {}],
  languages: ['zh-CN'],
};

const processor = getConfigProcessor('docgen');
if (processor) {
  config = processor(config) || config;
}

export default config;
