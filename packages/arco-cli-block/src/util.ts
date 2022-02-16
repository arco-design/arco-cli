import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import wget from 'wget-improved';
import { exec } from 'child_process';
import { ESLint } from 'eslint';
import * as prettier from 'prettier';
import ora, { Color } from 'ora';
import { getGlobalInfo } from 'arco-cli-dev-utils';

type DependenceInfoMap = {
  [propName: string]: string;
};

/**
 * Default logger implementation with ora
 */
export class DefaultLogger {
  private _spinner: ora.Ora;

  public constructor(startText: string) {
    this._spinner = ora(startText).start();
  }

  public log(text: string, color?: Color): void {
    if (color) {
      this._spinner.color = color;
    }
    this._spinner.text = text;
  }

  public succeed(text: string): void {
    this._spinner.succeed(text);
  }

  public fail(text: string): void {
    this._spinner.fail(text);
  }
}

/**
 * Get the scope and name of the NPM package
 */
export function getPackageScopeAndName(npmName: string) {
  const segIndex = npmName.indexOf('/');
  const scope = npmName.substr(0, segIndex) || '';
  const name = npmName.substr(segIndex + 1);
  return { scope, name };
}

/**
 * Get the NPM package download address
 */
export async function getNpmTarSrc(name: string) {
  const hostNPM = getGlobalInfo().host.npm;
  const { data } = await axios({
    url: `${hostNPM}${name}`,
    method: 'GET',
    responseType: 'json',
  });
  const version = data[`dist-tags`].latest;
  return {
    npmTarSrc: data.versions[version].dist.tarball,
    version,
  };
}

/**
 * Use wget to download files
 */
export async function wgetAsync(src: string, output: string, options?: {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const download = wget.download(src, output, options);
    download.on('error', function (err) {
      reject(err);
    });
    download.on('end', function (output) {
      resolve(output);
    });
  });
}

/**
 * Get dependencies already installed
 */
export function getExistingDependencies(filePath: string): Record<string, string> {
  const breakCondition = '/';
  let curPath = filePath;
  while (curPath !== breakCondition) {
    const pathPackageJson = path.resolve(curPath, 'package.json');

    if (fs.existsSync(pathPackageJson)) {
      const pkg = require(path.resolve(curPath, 'package.json'));
      return pkg.dependencies || {};
    }

    curPath = path.resolve(curPath, '../');
  }
}

/**
 * Get dependencies need to install
 */
export function getNewDependencies(
  existingDependencies: DependenceInfoMap,
  willInstalledDependencies: DependenceInfoMap
): string[] {
  const allKeys: string[] = Object.keys(willInstalledDependencies);
  const keys: (string | undefined)[] = allKeys.map((item) => {
    if (!existingDependencies[item]) {
      return item;
    }
  });
  return keys || [];
}

/**
 * Get the name and version of the dependent package
 */
export function getDependenceNameAndVersion(
  dependencies: DependenceInfoMap,
  filters: (string | undefined)[]
): string {
  let dependenciesArr: any[] = [];
  const keys = Object.keys(dependencies);
  dependenciesArr = keys.map((item) => {
    if (filters.includes(item)) {
      return `${item}@${dependencies[item]}`;
    }
  });
  return dependenciesArr.join(' ').trim();
}

/**
 * Get the way of dependency management
 */
function getProjectPackageControlType(curPath: string): 'yarn' | 'npm' {
  const breakCondition = '/';
  while (curPath !== breakCondition) {
    const packageLockPath = path.resolve(curPath, 'package-lock.json');
    const yarnLockPath = path.resolve(curPath, 'yarn.lock');
    if (fs.existsSync(yarnLockPath)) {
      return 'yarn';
    }
    if (fs.existsSync(packageLockPath)) {
      return 'npm';
    }
    curPath = path.resolve(curPath, '../');
  }
  return 'yarn';
}

/**
 * Install npm dependencies
 */
export async function installDependency(
  npmName: string,
  cwdPath: string,
  logFun: (msg: string) => void
) {
  return new Promise((resolve) => {
    const type = getProjectPackageControlType(cwdPath);
    const registry = getGlobalInfo().host.npm;
    const ls = exec(
      type === 'yarn'
        ? `yarn add ${npmName} -S --registry=${registry}`
        : `npm i ${npmName} -S --registry=${registry}`,
      {
        cwd: cwdPath,
      }
    );
    ls.stdout &&
      ls.stdout.on('data', function (data) {
        logFun(data.toString());
      });
    ls.stderr &&
      ls.stderr.on('data', function (data) {
        logFun(data.toString());
      });
    ls.on('exit', function (exitcode: string) {
      resolve(exitcode);
    });
  });
}

/**
 * Format error message
 */
export function stringifyError(e: Error) {
  return `${e.message}\n${e.stack}`;
}

export async function formatCodeWithPrettierAndEslint(
  code: string,
  filename: string,
  parser?: prettier.BuiltInParserName
) {
  const resolvePrettierConfig = await prettier.resolveConfig(filename);
  const prettierConfig: prettier.Options = resolvePrettierConfig || {};
  prettierConfig.parser = parser || 'typescript';
  const prettyCode = prettier.format(code, prettierConfig);
  const eslinted = await lintAndFixCode(filename, prettyCode);
  return eslinted;
}

async function lintAndFixCode(filename: string, source: string): Promise<string> {
  const eslint = new ESLint({ fix: true });
  const messages = await eslint.lintText(source, { filePath: filename });
  const lintResult = messages[0];
  return lintResult.output || source;
}
