import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';
import chalk from 'chalk';
import frontMatter from 'front-matter';
import { print } from '@arco-design/arco-dev-utils';
import injectProps from './injectProps';
import injectDemoCodes from './injectDemoCodes';
import { CWD } from '../../constant';
import config, { DOCGEN_LANGUAGE_PLACEHOLDER_IN_FILENAME } from '../../config/docgen.config';

const PLACEHOLDER_PROP = '%%Props%%';
const PLACEHOLDER_DEMO = '%%Demos%%';

/**
 * Check if config is valid
 */
function preCheck(): boolean {
  if (!config.languages.length) {
    print.error('[arco-scripts]', 'Please specify at least one target language');
    return false;
  }

  if (!config.tsParseTool) {
    print.error('[arco-scripts]', 'Please specify the tool to generate doc by TS type');
    return false;
  }

  if (config.tsParseTool[0] === 'react-docgen-typescript') {
    print.warn(
      '[arco-scripts]',
      'react-docgen-typescript will be removed in the next major version, please consider using ts-document for document extraction'
    );
  }
}

function getFilenameLanguageMap() {
  const templateFilenameLanguageMap: Record<string, string> = {};
  const outputFilenameLanguageMap: Record<string, string> = {};

  config.languages.forEach((lang) => {
    templateFilenameLanguageMap[lang] = config.template.replace(
      DOCGEN_LANGUAGE_PLACEHOLDER_IN_FILENAME,
      lang
    );
    outputFilenameLanguageMap[lang] = config.outputFileName.replace(
      DOCGEN_LANGUAGE_PLACEHOLDER_IN_FILENAME,
      lang
    );
  });

  return [templateFilenameLanguageMap, outputFilenameLanguageMap];
}

export default (components: string[]) => {
  if (preCheck() === false) {
    return;
  }

  const [templateFilenameMap, outputFilenameMap] = getFilenameLanguageMap();

  // Filter out components that can be automatically generated
  const componentDirs = glob.sync(config.entry).filter((dir) => {
    try {
      if (fs.lstatSync(dir).isDirectory()) {
        // Not within the component parameter specified by the user
        if (components && components.indexOf(dir.match(/[^\/]+$/g)[0]) === -1) {
          return false;
        }

        // No template file found
        let hasTemplateFile = false;
        for (const lang in templateFilenameMap) {
          if (fs.existsSync(path.resolve(dir, templateFilenameMap[lang]))) {
            hasTemplateFile = true;
            break;
          }
        }

        if (!hasTemplateFile) {
          !dir.endsWith('/style') &&
            print.error('[arco-scripts]', `Template for docgen ${dir} not found`);
          return false;
        }

        return true;
      }
    } catch (e) {}

    return false;
  });

  if (!componentDirs.length) {
    print.warn('[arco-scripts]', 'No valid entry for doc generate');
    return;
  }

  print.info('[arco-scripts]', 'Start to generate document...');

  componentDirs.forEach((dir) => {
    const replacePlaceholder = (language) => {
      const templateFilename = templateFilenameMap[language];
      const outputFilename = outputFilenameMap[language];
      const templatePath = path.resolve(dir, templateFilename);

      if (!fs.existsSync(templatePath)) {
        print.error('[arco-scripts]', `Template ${templatePath} not found`);
      }

      const fmResult = frontMatter<Record<string, any>>(fs.readFileSync(templatePath, 'utf8'));
      const attributes = fmResult.attributes;
      let markdownBody = fmResult.body;

      // Inject Props doc
      markdownBody = injectProps({
        currentDir: dir,
        attributes,
        markdownBody,
        placeholder: PLACEHOLDER_PROP,
        language,
      });

      // Inject Demos
      const demoEntries = glob.sync(path.resolve(dir, config.demoGlob));
      markdownBody = injectDemoCodes({ demoEntries, markdownBody, placeholder: PLACEHOLDER_DEMO });

      fs.outputFileSync(config.output || path.resolve(dir, outputFilename), markdownBody);
    };

    config.languages.forEach(replacePlaceholder);

    print.success(
      '[arco-scripts]',
      `${chalk.black.bgGreen.bold(`Generate API for ${path.relative(CWD, dir)} Success!`)}`
    );
  });
};
