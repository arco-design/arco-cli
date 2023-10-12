import path, { resolve } from 'path';
import axios from 'axios';
import fs from 'fs-extra';
import compressing from 'compressing';
import ora from 'ora';
import chalk from 'chalk';

import { wgetAsync } from './utils/wgetAsync';
import { toFsCompatible } from './utils/toFsCompatible';

const SOURCE_DIR_NAME = 'source';
const CONFIG_FILENAME_SUFFIX = '-config.json';

export class Forker {
  private readonly tempDir = resolve(__dirname, '.temp');

  private readonly spinner = ora();

  constructor(
    private readonly componentId: string,
    private readonly path: string,
    private readonly host: string = 'arco.design',
    private readonly overwrite = false
  ) {
    fs.ensureDirSync(this.tempDir);
  }

  private async cleanTempDir() {
    if (fs.existsSync(this.tempDir)) {
      await fs.emptyDir(this.tempDir);
    }
  }

  async getMaterialZipURL(
    componentId: string = this.componentId
  ): Promise<{ ok: boolean; forkable?: boolean; url?: string }> {
    if (componentId) {
      try {
        const {
          data: { ok, result },
        } = await axios.post(`https://${this.host}/material/api/material`, {
          name: componentId,
          needPackageInfo: false,
        });

        if (ok && result.length) {
          const [targetMaterial] = result;
          return {
            ok: true,
            forkable: !!targetMaterial?.forkable,
            url: targetMaterial?.fileManifest?.cdn?.zip || '',
          };
        }
      } catch (e) {}
    }

    return { ok: false };
  }

  private async downloadAndUnzipFiles(zipURL: string): Promise<{
    ok: boolean;
    msg?: string;
    path?: string;
    config?: Record<string, any> & { forkable?: boolean | { sources: string[] } };
  }> {
    const componentDirName = toFsCompatible(this.componentId);
    const unzipDirPath = resolve(this.tempDir, componentDirName);
    const zipPath = resolve(this.tempDir, `${componentDirName}.zip`);

    try {
      // download component zip files
      await wgetAsync(zipURL, zipPath);
      // unzip files
      await compressing.zip.uncompress(zipPath, unzipDirPath);

      const componentSourceDir = resolve(unzipDirPath, SOURCE_DIR_NAME);
      const componentForkConfigFilePath = resolve(
        componentSourceDir,
        `${toFsCompatible(this.componentId)}${CONFIG_FILENAME_SUFFIX}`
      );

      if (fs.existsSync(componentSourceDir) && fs.existsSync(componentForkConfigFilePath)) {
        const config = await fs.readJson(componentForkConfigFilePath);
        const componentConfig = config['arco.aspect/workspace']?.component;
        return { ok: true, path: componentSourceDir, config: componentConfig };
      }

      return {
        ok: false,
        msg: `component source code directory not found, ${componentSourceDir} does not exist`,
      };
    } catch (err) {
      return {
        ok: false,
        msg: err.toString(),
      };
    }
  }

  async fork(): Promise<{ ok: boolean; componentConfig?: Record<string, any> }> {
    this.spinner.start(`fetching component info of ${this.componentId}...`);

    let succeed = false;
    let componentConfig: Record<string, any> = null;

    const { ok: materialInfoGot, forkable, url: zipURL } = await this.getMaterialZipURL();

    if (forkable && zipURL) {
      this.spinner.start('downloading component files...');
      const { ok, msg, config, path: sourceDir } = await this.downloadAndUnzipFiles(zipURL);
      componentConfig = config;

      if (ok) {
        this.spinner.start('coping component files to target path...');

        const pathsToCopy: string[] = [];
        if (typeof config.forkable === 'object' && Array.isArray(config?.forkable?.sources)) {
          pathsToCopy.push(
            ...config.forkable.sources.map((sourcePath) => resolve(sourceDir, sourcePath))
          );
        }

        if (pathsToCopy.length <= 1) {
          const dirToFlat = pathsToCopy.pop() || sourceDir;
          const currentDirName = path.basename(dirToFlat);
          (await fs.readdir(dirToFlat, { withFileTypes: true })).forEach((child) => {
            if (!child.name.endsWith(CONFIG_FILENAME_SUFFIX)) {
              pathsToCopy.push(resolve(sourceDir, currentDirName, child.name));
            }
          });
        }

        try {
          // copy all source files to target dir
          await fs.ensureDir(this.path);
          await Promise.all(
            pathsToCopy.map(async (pathToCopy) => {
              await fs.copy(pathToCopy, resolve(this.path, path.basename(pathToCopy)), {
                overwrite: this.overwrite,
              });
            })
          );
          succeed = true;
        } catch (err) {
          this.spinner.fail(`failed to copy component source files to ${this.path}`);
          console.error(chalk.red(err.toString()));
        }
      } else {
        this.spinner.fail(`failed to download component source files from ${zipURL}`);
        console.error(chalk.red(msg));
      }
    } else {
      this.spinner.fail(
        `this component cannot be forked, ${
          materialInfoGot
            ? forkable
              ? 'URL of its source files are not found, please contact the material author'
              : 'it not a forkable component, please contact the material author'
            : `failed to get material info of ${this.componentId}`
        }`
      );
    }

    // clear temp download files
    await this.cleanTempDir();

    if (succeed) {
      this.spinner.succeed(`component ${this.componentId} has been forked`);
    }

    return { ok: succeed, componentConfig };
  }
}
