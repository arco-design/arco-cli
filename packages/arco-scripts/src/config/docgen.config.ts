import { DIR_NAME_COMPONENT_LIBRARY, DIR_NAME_DEMO, FILENAME_README } from '../constant';
import getConfigProcessor from '../scripts/utils/getConfigProcessor';

type APIParseTools = 'ts-document' | 'react-docgen-typescript';

export type DocgenConfigType = {
  /** Filename of template */
  template: string;
  /** Glob of entry files fo generate document */
  entry: string;
  /** Path fo output document */
  output: string;
  /** Filename of file output */
  outputFileName: string;
  /** Glob of demos */
  demoGlob: string;
  /** Tools to parse typescript */
  tsParseTool: [APIParseTools, Record<string, any> | Array<any>];
  /** Target language */
  languages: Array<'zh-CN' | 'en-US'>;
};

/**
 * Language placeholder in file name configuration
 */
export const DOCGEN_LANGUAGE_PLACEHOLDER_IN_FILENAME = '[language]';

let config: DocgenConfigType = {
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
