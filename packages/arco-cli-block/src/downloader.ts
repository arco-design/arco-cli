import path from 'path';
import mkdirp from 'mkdirp';
import compressing from 'compressing';
import fs from 'fs-extra';
import { cmd } from 'arco-cli-dev-utils';

import {
  getPackageScopeAndName,
  getNpmTarSrc,
  wgetAsync,
  getExistingDependencies,
  getNewDependencies,
  getDependenceNameAndVersion,
} from './util';
import locale from './locale';

interface NpmPackageManipulatorContext {
  /**
   * Root path of executing directory. Used to generate path of temp file folder.
   */
  root?: string;
  /**
   * Temp directory name.
   */
  tempDirectoryName?: string;
  /**
   * Logs during download and unzip will be printed through this function.
   */
  log: (msg: string) => void;
}

interface PackageInfo {
  path: string;
  packageJson: { [key: string]: any };
}

const DEFAULT_CACHE_DIRECTORY_NAME = 'download';
const PACKAGE_JSON_RELATIVE_PATH = './package.json';

/**
 * Store the information of a downloaded package including "path", "packageJson" and etc.
 */
class PackageInfoMap {
  private _map: Map<string, PackageInfo> = new Map();

  public set(packageName: string, entryPath: string) {
    const packageJson = fs.readJsonSync(path.join(entryPath, PACKAGE_JSON_RELATIVE_PATH));
    this._map.set(packageName, { path: entryPath, packageJson });
  }

  public get(packageName: string) {
    return this._map.get(packageName);
  }
}

/**
 * Manipulate npm package download and dependencies installation in main project.
 *
 * @example
 * const npm = new NpmPackageManipulator(...);
 * await npm.downloadAndUnzipNpmPackage('react');
 */
export class NpmPackageManipulator {
  private _ctx: NpmPackageManipulatorContext;

  readonly _root: string;

  readonly _tempDirectoryPath: string;

  private _packageMap = new PackageInfoMap();

  public constructor(ctx: NpmPackageManipulatorContext) {
    this._ctx = ctx;
    this._root = ctx.root || process.cwd();

    const tempDirectoryName = ctx.tempDirectoryName || DEFAULT_CACHE_DIRECTORY_NAME;
    this._tempDirectoryPath = path.join(this._root, `.${tempDirectoryName}`);
  }

  /**
   * Download target npm package.
   */
  public async downloadAndUnzipNpmPackage(packageName: string): Promise<string> {
    const { scope, name } = getPackageScopeAndName(packageName);
    const { npmTarSrc } = await getNpmTarSrc(packageName);

    mkdirp.sync(path.join(this._tempDirectoryPath, scope));

    const zipFileDownloadPath = path.join(this._tempDirectoryPath, `${name}.tgz`);
    this._ctx.log(locale.TIP_DOWNLOAD_ING);
    await wgetAsync(npmTarSrc, zipFileDownloadPath);
    this._ctx.log(locale.TIP_DOWNLOAD_DONE);

    // Unzip target npm zip file.
    const unzipTargetPath = path.join(this._tempDirectoryPath, name);
    this._ctx.log(locale.TIP_UNZIP_ING);
    await compressing.tgz.uncompress(zipFileDownloadPath, unzipTargetPath);
    this._ctx.log(locale.TIP_UNZIP_DONE);

    this._packageMap.set(packageName, path.join(unzipTargetPath, 'package'));
    return unzipTargetPath;
  }

  public getPackageDownloadPath(packageName: string) {
    return this.getPackageInfo(packageName).path;
  }

  /**
   * The function will look up from "comparisonTargetFilePath" to find a package.json and use its dependencies
   * to generate diff deps.
   */
  public getPackageDependenciesPackString(packageName: string, comparisonTargetFilePath: string) {
    const projectDependencies = getExistingDependencies(comparisonTargetFilePath);
    const packageJson = this.getPackageInfo(packageName).packageJson;
    const dependencies = packageJson.dependencies;
    let dependenciesStr = '';
    if (dependencies) {
      const diffDeps = getNewDependencies(projectDependencies, dependencies) || [];
      dependenciesStr = getDependenceNameAndVersion(packageJson.dependencies || {}, diffDeps);
    }

    return dependenciesStr;
  }

  private getPackageInfo(packageName: string) {
    const info = this._packageMap.get(packageName);

    if (!info) {
      throw new Error(
        'Trying to get a undownloaded package: ' +
          `"${packageName}"` +
          "\nPlease invoke 'downloadAndUnzipNpmPackage()' first."
      );
    }

    return info;
  }

  public async clean() {
    await cmd.execQuick(`rm -rf ${this._tempDirectoryPath}`);
    this.cleanMap();
  }

  private cleanMap() {
    this._packageMap = new PackageInfoMap();
  }
}
