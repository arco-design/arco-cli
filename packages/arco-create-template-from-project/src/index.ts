import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import inquirer from 'inquirer';
import { print, confirm, materialTemplate } from '@arco-design/arco-dev-utils';

import locale from './locale';

const { transformToTemplate } = materialTemplate;

const TEMPLATE_DIR = 'template';
const TEMPLATE_DIR_FOR_MONOREPO = 'template-for-monorepo';

const PACKAGE_JSON = {
  name: '',
  version: '1.0.0',
  description: '',
  files: ['hook', TEMPLATE_DIR, TEMPLATE_DIR_FOR_MONOREPO],
  license: 'MIT',
  dependencies: {
    '@arco-design/arco-dev-utils': '^1.6.0',
  },
};

export default async function () {
  const spinner = ora();
  const cwdPath = process.cwd();

  const { projectPath, templatePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectPath',
      message: locale.TIP_INPUT_PROJECT_PATH,
    },
    {
      type: 'input',
      name: 'templatePath',
      message: locale.TIP_INPUT_TEMPLATE_PATH,
    },
  ]);

  if (
    !(await confirm(
      () => fs.pathExistsSync(templatePath),
      `${locale.WARN_PATH_ALREADY_EXIST} ${print.chalk.yellow(templatePath)} `
    ))
  ) {
    process.exit(0);
  }

  const { isForMonorepo } = await inquirer.prompt({
    type: 'confirm',
    name: 'isForMonorepo',
    message: locale.TIP_IS_FOR_MONOREPO,
    default: false,
  });

  const templateFilePath = path.resolve(
    templatePath,
    isForMonorepo ? TEMPLATE_DIR_FOR_MONOREPO : TEMPLATE_DIR
  );

  // Initialize the template directory structure
  fs.ensureDirSync(templatePath);
  const packageJsonPath = path.resolve(templatePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const { packageName } = await inquirer.prompt({
      type: 'input',
      name: 'packageName',
      message: locale.TIP_INPUT_PACKAGE_NAME,
    });
    fs.writeJsonSync(packageJsonPath, { ...PACKAGE_JSON, name: packageName }, { spaces: 2 });
  }

  // Copy project content
  try {
    spinner.start(locale.TIP_TEMPLATE_COPY_ING);
    fs.emptyDirSync(templateFilePath);
    fs.copySync(projectPath, templateFilePath);
    spinner.succeed(locale.TIP_TEMPLATE_COPY_DONE);
  } catch (err) {
    spinner.fail(locale.TIP_TEMPLATE_COPY_FAILED);
    print.error(err);
    process.exit(1);
  }

  process.chdir(templateFilePath);

  // Transform project to template
  try {
    spinner.start(locale.TIP_TEMPLATE_ADAPT_ING);
    await transformToTemplate({ root: templateFilePath });
    spinner.succeed(locale.TIP_TEMPLATE_ADAPT_DONE);
  } catch (err) {
    spinner.fail(locale.TIP_TEMPLATE_ADAPT_FAILED);
    print.error(err);
    process.exit(1);
  }

  process.chdir(cwdPath);
}
