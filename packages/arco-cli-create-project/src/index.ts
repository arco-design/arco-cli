import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import {
  print,
  materialTemplate,
  isInGitRepository,
  CONSTANT,
  execQuick,
} from 'arco-cli-dev-utils';

import locale from './locale';

export interface CreateProjectOptions {
  /** Path of project */
  root: string;
  /** Name of project template */
  template: string;
  /** Name of project */
  projectName: string;
  /** Contents of package.json */
  packageJson?: { [key: string]: any };
  /** Whether is for Lerna project */
  isForMonorepo?: boolean;
  /** Callback before git commit */
  beforeGitCommit?: () => void;
  /** Extra parameters passed to custom project init function */
  customInitFunctionParams?: Record<string, any>;
}

const TEMPLATE_DIR = 'template';
const TEMPLATE_DIR_FOR_MONOREPO = 'template-for-monorepo';

const CUSTOM_INIT_DIR = '.arco-cli';

// Path of directory to download template from npm, will be removed after project created
const PATH_TEMPLATE_DOWNLOAD = path.resolve(
  CONSTANT.PATH_HOME_DIR,
  '.arco_template_cache',
  `${+Date.now()}`
);

function addGitIgnore() {
  const sourceFilename = 'gitignore';
  const targetFilename = '.gitignore';

  if (fs.existsSync(sourceFilename)) {
    if (fs.existsSync(targetFilename)) {
      const data = fs.readFileSync(sourceFilename);
      fs.appendFileSync(targetFilename, data);
      fs.unlinkSync(sourceFilename);
    } else {
      try {
        fs.moveSync(sourceFilename, targetFilename);
      } catch (e) {}
    }
  }
}

async function tryGitCommit(commitMessage: string) {
  const { code: codeAdd, stderr: errAdd } = await execQuick('git add -A');
  const { code: codeCommit, stderr: errCommit } = await execQuick(
    `git commit -m "${commitMessage}" --no-verify`
  );

  if (codeAdd !== 0 || codeCommit !== 0) {
    print.warn('Git commit not created', errAdd || errCommit);
    print.warn('Removing .git directory...');
    try {
      fs.removeSync('./.git');
    } catch (_) {}
  }
}

function getPackageInfo(installPackage: string) {
  // match package with version
  if (installPackage.match(/.+@/)) {
    return {
      name: installPackage.charAt(0) + installPackage.substr(1).split('@')[0],
      version: installPackage.split('@')[1],
    };
  }

  // match local file path
  if (installPackage.match(/^file:/)) {
    const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
    const { name, version } = require(path.join(installPackagePath, 'package.json'));
    return { name, version };
  }

  return { name: installPackage };
}

async function handleDependencies(dependencies: string | string[], allowYarn = false) {
  let command = 'npm';
  let args = ['install'].concat(dependencies || []);

  if (allowYarn) {
    try {
      const { stdout } = await execQuick('yarn -v');
      if (stdout.match(/^\d+\.\d+/)) {
        command = 'yarn';
        args = dependencies ? ['add'].concat(dependencies) : [];
      }
    } catch (e) {}
  }

  const commandExec = `${command} ${args.join(' ')}`;
  const { code, stderr } = await execQuick(commandExec);

  if (code !== 0) {
    throw new Error(`Command 「${commandExec}」 executed failed:\n${stderr}`);
  }
}

function exitProcess(err) {
  console.error(err);
  fs.removeSync(PATH_TEMPLATE_DOWNLOAD);
  process.exit(1);
}

async function copyTemplateContent({
  root,
  spinner,
  template,
  isForMonorepo,
  customInitFunctionParams,
}: {
  root: string;
  template: string;
  isForMonorepo: boolean;
  spinner: ora.Ora;
  customInitFunctionParams?: CreateProjectOptions['customInitFunctionParams'];
}): Promise<(params: { root: string; projectName: string; isForMonorepo: boolean }) => void> {
  const prevCwd = process.cwd();

  fs.ensureDirSync(PATH_TEMPLATE_DOWNLOAD);
  process.chdir(PATH_TEMPLATE_DOWNLOAD);

  // Download template
  try {
    spinner.start(locale.TIP_TEMPLATE_DOWNLOAD_ING);
    // Init a empty package.json
    fs.writeJsonSync('./package.json', {});
    await handleDependencies(template);
    spinner.succeed(locale.TIP_TEMPLATE_DOWNLOAD_DONE);
  } catch (err) {
    spinner.fail(locale.TIP_TEMPLATE_DOWNLOAD_FAILED);
    exitProcess(err);
  }

  const pathTemplatePackage = path.resolve(`node_modules/${getPackageInfo(template).name}`);
  process.chdir(pathTemplatePackage);

  // Copy content of template
  try {
    spinner.start(locale.TIP_TEMPLATE_COPY_ING);

    const pathCustomProjectInitFunc = path.resolve(`${CUSTOM_INIT_DIR}/init.js`);
    if (fs.existsSync(TEMPLATE_DIR) || fs.existsSync(TEMPLATE_DIR_FOR_MONOREPO)) {
      await fs.copy(
        isForMonorepo && TEMPLATE_DIR_FOR_MONOREPO ? TEMPLATE_DIR_FOR_MONOREPO : TEMPLATE_DIR,
        root,
        {
          overwrite: true,
        }
      );
    } else if (fs.existsSync(pathCustomProjectInitFunc)) {
      const init = require(pathCustomProjectInitFunc);
      await init({
        ...customInitFunctionParams,
        projectPath: root,
      });
    }

    spinner.succeed(locale.TIP_TEMPLATE_COPY_DONE);
  } catch (err) {
    spinner.fail(locale.TIP_TEMPLATE_COPY_FAILED);
    exitProcess(err);
  }

  let afterInit;
  try {
    afterInit = require(path.resolve(`${pathTemplatePackage}/hook/after-init.js`));
  } catch (e) {}
  try {
    afterInit = require(path.resolve(`${pathTemplatePackage}/${CUSTOM_INIT_DIR}/after-init.js`));
  } catch (e) {}

  process.chdir(prevCwd);

  return afterInit;
}

export default async function ({
  root,
  template,
  projectName = '',
  packageJson = {},
  isForMonorepo = false,
  beforeGitCommit,
  customInitFunctionParams,
}: CreateProjectOptions) {
  const spinner = ora();
  const originalDirectory = process.cwd();
  if (template.match(/^file:/)) {
    template = `file:${path.resolve(originalDirectory, template.match(/^file:(.*)?$/)[1])}`;
  }

  print(`\n${locale.TIP_PROJECT_INIT_ING} ${chalk.green(root)}`);
  fs.emptyDirSync(root);
  process.chdir(root);

  const afterInit = await copyTemplateContent({
    root,
    spinner,
    template,
    isForMonorepo,
    customInitFunctionParams,
  });

  // Preprocess template content, replace constants, process package names, etc.
  try {
    spinner.start(locale.TIP_TEMPLATE_ADAPT_ING);
    await materialTemplate.transformToProject({
      root,
      packageJson,
    });
    spinner.succeed(locale.TIP_TEMPLATE_ADAPT_DONE);
  } catch (err) {
    spinner.fail(locale.TIP_TEMPLATE_ADAPT_FAILED);
    exitProcess(err);
  }

  // Init Git
  addGitIgnore();
  if (!(await isInGitRepository())) {
    const { stderr, code } = await execQuick('git init');
    code !== 0 && print.warn(locale.ERROR_GIT_INIT_FAILED, stderr);
  }

  // Install dependencies
  try {
    spinner.start(locale.TIP_DEPENDENCIES_INSTALL_ING);
    await handleDependencies(null, true);
    spinner.succeed(locale.TIP_DEPENDENCIES_INSTALL_DONE);
  } catch (err) {
    spinner.fail(locale.TIP_DEPENDENCIES_INSTALL_FAILED);
    print.error(err);
  }

  typeof beforeGitCommit === 'function' && beforeGitCommit();

  // Execute after-init.js defined in template
  try {
    if (afterInit) {
      await afterInit({
        root,
        projectName,
        isForMonorepo,
      });
    } else {
      // Try to build project
      spinner.start(locale.TIP_PROJECT_BUILD_ING);
      const { code, stderr } = await execQuick('npm run build');
      if (code === 0) {
        spinner.succeed(locale.TIP_PROJECT_BUILD_DONE);
      } else {
        spinner.warn(locale.TIP_PROJECT_BUILD_FAILED);
        print.warn(`Command executed failed: npm run build\n${stderr}`);
      }

      // Print help info
      print.divider();
      print.success(` ${locale.TIP_PROJECT_INIT_DONE}`);
      if (isForMonorepo) {
        print.success(` ${locale.TIP_HELP_INFO_LERNA}`);
        print.success('   $ yarn dev');
      } else {
        print.success(` ${locale.TIP_HELP_INFO}`);
        print.success(`   $ cd ${projectName}`);
        print.success('   $ npm run dev');
      }
      print.divider();
    }
  } catch (error) {
    print.error(['arco-init'], locale.ERROR_PROJECT_INIT_FAILED);
    print.error(error);
  }

  // First Git commit
  await tryGitCommit(
    `arco-cli: ${isForMonorepo ? 'add package' : 'initialize'} ${packageJson.name || 'project'}`
  );

  // Clear template download directory
  fs.removeSync(PATH_TEMPLATE_DOWNLOAD);
}
