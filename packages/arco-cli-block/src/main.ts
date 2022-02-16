import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import { cmd } from 'arco-cli-dev-utils';

import { NpmPackageManipulator } from './downloader';
import {
  formatCodeWithPrettierAndEslint,
  installDependency,
  DefaultLogger,
  stringifyError,
} from './util';
import { ArcoProPageInsertConfig, ArcoProBlockInsertConfig } from './interface';
import {
  handleArcoProI18n,
  handleArcoProMock,
  handleArcoProRedux,
  handleArcoProRoute,
} from './babel';
import locale from './locale';

const PATH_TARGET_IN_PROJECT = 'src/pages';
const PATH_SOURCE_IN_MATERIAL = 'src/page';

interface ContextConfig {
  /**
   * Root path of project
   */
  rootPath: string;
  /**
   * Whether log progress info
   */
  silent: boolean;
}

async function handleFsCopy(source: string, target: string) {
  const cpCommand = `cp -rf '${source}/.' '${target}'`;
  const isTargetPathExists = fs.existsSync(target);

  if (!isTargetPathExists) {
    await mkdirp(target);
  }
  await cmd.execQuick(cpCommand);
}

async function handleArcoProFsWrite(config: {
  cwd: string;
  pageName: string;
  codeDownloadPath: string;
  packageName: string;
}) {
  const { pageName, codeDownloadPath, packageName, cwd } = config;
  const pagePath = path.join(cwd, PATH_TARGET_IN_PROJECT, pageName);
  await mkdirp(pagePath);

  // Currently we copy files under src.
  const codePath = path.join(codeDownloadPath, PATH_SOURCE_IN_MATERIAL);
  const isPathExists = fs.existsSync(codePath);

  if (!isPathExists) {
    throw new Error(
      `Directory ${PATH_SOURCE_IN_MATERIAL} not found in ${packageName}, cannot insert to project as a page.`
    );
  }

  const cpCommand = `cp -rf '${codePath}/.' '${pagePath}'`;
  await cmd.execQuick(cpCommand);

  return pagePath;
}

async function arcoBlockInsertInner(
  { packageName, sourcePath, targetPath }: ArcoProBlockInsertConfig,
  { rootPath }: ContextConfig,
  npmPackageManipulator: NpmPackageManipulator,
  logProgress: (msg: string) => void
) {
  await npmPackageManipulator.downloadAndUnzipNpmPackage(packageName);
  logProgress(locale.TIP_COPY_SOURCE_ING);

  const pathCodeDownload = npmPackageManipulator.getPackageDownloadPath(packageName);
  const source = path.join(pathCodeDownload, 'src', sourcePath);
  const target = path.join(rootPath, 'src', targetPath);

  if (!fs.existsSync(source)) {
    throw new Error(`Directory ${sourcePath} not found in ${packageName}`);
  }

  await handleFsCopy(source, target);
  logProgress(locale.TIP_COPY_SOURCE_DONE);

  // Installing dependencies.
  const depStr = npmPackageManipulator.getPackageDependenciesPackString(packageName, rootPath);
  if (depStr.trim() !== '') {
    logProgress(`${locale.TIP_INSTALL_DEP_ING}${depStr}`);

    const exitCode = await installDependency(depStr, rootPath, logProgress);
    if (exitCode !== 0) {
      throw new Error(`Failed to install npm dependency, please check yarn or npm environment.`);
    } else {
      logProgress(locale.TIP_INSTALL_DEP_DONE);
    }
  }
}

/**
 * Insert block
 */
export async function arcoBlockInsert(config: ArcoProBlockInsertConfig, ctxConfig: ContextConfig) {
  const defaultLogger = new DefaultLogger(locale.TIP_INSERT_BLOCK_ING);
  const logProgress = ctxConfig.silent ? () => {} : (_msg: string) => defaultLogger.log(_msg);
  const npmPackageManipulator = new NpmPackageManipulator({
    root: ctxConfig.rootPath,
    log: logProgress,
  });

  try {
    await arcoBlockInsertInner(config, ctxConfig, npmPackageManipulator, logProgress);
  } catch (e) {
    defaultLogger.fail(stringifyError(e));
    return;
  } finally {
    await npmPackageManipulator.clean();
  }
  defaultLogger.succeed(locale.TIP_INSERT_BLOCK_DONE);
}

/**
 * Insert page
 */
export async function arcoPageInsert(
  config: ArcoProPageInsertConfig,
  contextConfig: ContextConfig
) {
  const defaultLogger = new DefaultLogger(locale.TIP_INSERT_PAGE_ING);
  const logger = contextConfig.silent ? () => {} : (_msg: string) => defaultLogger.log(_msg);
  const npmPackageManipulator = new NpmPackageManipulator({
    root: contextConfig.rootPath,
    log: logger,
  });

  try {
    await executePageWriting(config, npmPackageManipulator, contextConfig, defaultLogger);
  } catch (e) {
    defaultLogger.fail(stringifyError(e));
    return;
  }

  defaultLogger.succeed(locale.TIP_INSERT_PAGE_DONE);
}

export async function executePageWriting(
  config: ArcoProPageInsertConfig,
  packageManipulator: NpmPackageManipulator,
  { rootPath, silent }: ContextConfig,
  logger: DefaultLogger
) {
  const { routeConfig, packageName } = config;
  // PageName represents the folder name of the current newly created page in the Arco pro project
  // It is also equivalent to the folder name of this newly created page
  // Currently this value is directly derived from 'componentPath'
  const pageName = routeConfig.componentPath;

  const logProgress = silent ? () => {} : (_msg: string) => logger.log(_msg);
  await packageManipulator.downloadAndUnzipNpmPackage(packageName);
  const codeDownloadPath = packageManipulator.getPackageDownloadPath(packageName);

  logProgress(locale.TIP_COPY_SOURCE_ING);
  // Path of target file
  const pagePath = await handleArcoProFsWrite({
    packageName,
    pageName,
    cwd: rootPath,
    codeDownloadPath,
  });
  logProgress(locale.TIP_COPY_SOURCE_DONE);

  logProgress(locale.TIP_HANDLE_MOCK_FILE_ING);
  await handleCodeInjection(pagePath, rootPath, pageName, config);

  // Installing dependencies.
  const depsStr = packageManipulator.getPackageDependenciesPackString(packageName, rootPath);
  if (depsStr.trim() !== '') {
    logProgress(`${locale.TIP_INSTALL_DEP_ING}${depsStr}`);

    const exitCode = await installDependency(depsStr, rootPath, logProgress);
    if (exitCode !== 0) {
      throw new Error(`Failed to install npm dependency, please check yarn or npm environment.`);
    } else {
      logProgress(locale.TIP_INSTALL_DEP_DONE);
    }
  }

  logProgress(locale.TIP_REMOVE_TEMP_FILE_ING);
  await packageManipulator.clean();
}

async function handleCodeInjection(
  pagePath: string,
  rootPath: string,
  pageName: string,
  config: ArcoProPageInsertConfig
) {
  const routeFilePath = path.join(rootPath, 'src/routes.tsx');
  const routeCode = fs.readFileSync(routeFilePath).toString();
  const changedRouteCode = handleArcoProRoute({
    routeCode,
    routeObj: config.routeConfig,
    routeParentKey: config.parentKey,
  });

  const formatAndWriteCode = async (code: string, filePath: string) => {
    const formattedRouteCode = await formatCodeWithPrettierAndEslint(code, filePath);
    fs.writeFileSync(filePath, formattedRouteCode);
  };

  await formatAndWriteCode(changedRouteCode, routeFilePath);

  const localePath = path.join(pagePath, 'locale');
  if (fs.existsSync(localePath)) {
    await Promise.all(
      fs.readdirSync(localePath).map(async (file) => {
        const extName = path.extname(file);
        const u18nType = path.basename(file, extName);
        const localeFilePath = path.join(rootPath, `src/locale/${file}`);
        const code = fs.readFileSync(localeFilePath).toString();
        const changedI18nCode = handleArcoProI18n({
          pageName,
          localCode: code,
          localFileName: u18nType,
        });

        await formatAndWriteCode(changedI18nCode, localeFilePath);
      })
    );
  }

  if (fs.existsSync(path.join(pagePath, 'redux'))) {
    const reduxFilePath = path.join(rootPath, `src/redux/index.ts`);
    const reduxCode = fs.readFileSync(reduxFilePath).toString();
    const changedReduxCode = handleArcoProRedux({
      code: reduxCode,
      pageName,
    });

    await formatAndWriteCode(changedReduxCode, reduxFilePath);
  }

  if (fs.existsSync(path.join(pagePath, 'mock.ts'))) {
    const mockFilePath = path.join(rootPath, `src/mock/index.ts`);
    const mockCode = fs.readFileSync(mockFilePath).toString();
    const changedMockCode = handleArcoProMock({
      code: mockCode,
      pageName,
    });

    await formatAndWriteCode(changedMockCode, mockFilePath);
  }
}
