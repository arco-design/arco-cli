import withReactDocgen from './withReactDocgen';
import withTsDocument from './withTsDocument';
import config from '../../../config/docgen.config';

export interface InjectPropsParams {
  /** Path of current component */
  currentDir: string;
  /** Attributes of template markdown */
  attributes: Record<string, any>;
  /** Content of template markdown */
  markdownBody: string;
  /** Placeholder for inserting Props doc */
  placeholder: string;
  /** Target language */
  language?: string;
}

export default function injectProps(options: InjectPropsParams) {
  const [tool, toolOptions] = config.tsParseTool;
  const { markdownBody, placeholder } = options;

  if (markdownBody.indexOf(placeholder) === -1) {
    return markdownBody;
  }

  if (tool === 'ts-document') {
    return withTsDocument(options, toolOptions);
  }

  return withReactDocgen(options);
}
