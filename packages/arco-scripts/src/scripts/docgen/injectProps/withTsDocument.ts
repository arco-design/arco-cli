import path from 'path';
import { generateMarkdown } from 'ts-document';
import { getRealRequirePath, print } from '@arco-design/arco-dev-utils';
import { InjectPropsParams } from './index';
import config from '../../../config/docgen.config';

const LANGUAGE_TRANSFER_MAP = {
  'zh-CN': 'zh',
  'en-US': 'en',
};

export default function withTsDocument({
  markdownBody,
  attributes,
  currentDir,
  placeholder,
  language,
}: InjectPropsParams) {
  const parseFiles = attributes.file ? attributes.file.split(',') : [];
  let propsTables = [];

  parseFiles.forEach((file) => {
    const [entryFilePath] = getRealRequirePath(file, currentDir);

    if (!entryFilePath) {
      print.error(['arco-scripts'], `Invalid entry path [${file}] for docgen`);
      return;
    }

    const markdownSchema: Record<string, any> = generateMarkdown(entryFilePath, {
      lang: LANGUAGE_TRANSFER_MAP[language],
      sourceFilesPaths: path.resolve(config.entry, '**/*.{ts,tsx}'),
    });

    if (markdownSchema) {
      propsTables = Object.entries(markdownSchema).map(([, ms]) => ms);
    }
  });

  return markdownBody.replace(placeholder, propsTables.length ? propsTables.join('\n\n') : '');
}
