import path from 'path';
import fs from 'fs-extra';
import { omit } from 'lodash';
import { sync as globSync } from 'glob';
import { PACKAGE_JSON, TIP_CHECK_MIGRATION, TSCONFIG_JSON } from '../constant';
import { AdapterOptions } from '../types';

export type PackageAdapterOptions = AdapterOptions;

export class PackageAdapter {
  private readonly isRootPackage: boolean;

  private readonly options: PackageAdapterOptions;

  constructor(options: PackageAdapterOptions) {
    this.options = options;
    this.isRootPackage = options.workspaceRoot === options.path;
  }

  private adaptPackageJSON() {
    const packageJsonPath = path.join(this.options.path, PACKAGE_JSON);
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJSONSync(packageJsonPath);

      // delete useless properties
      delete packageJson.umd;
      delete packageJson.arcoMeta;

      // handle scripts
      if (!this.isRootPackage) {
        packageJson.scripts ||= {};
        packageJson.scripts = omit(packageJson.scripts, [
          'dev',
          'build',
          'docgen',
          'test:client',
          'test:node',
          'test',
          'show:config',
          'clean',
          'prepublishOnly',
          'generate',
          'sync',
          'preview',
        ]);
        Object.assign(packageJson.scripts, {
          READ_THIS: `${TIP_CHECK_MIGRATION} All scripts depend on [arco-scripts] is deleted, please check these scripts`,
          clean: 'rm -rf es lib artifacts',
        });
      }

      // handle devDeps
      if (packageJson.devDependencies) {
        delete packageJson.devDependencies['arco-cli'];
        delete packageJson.devDependencies['arco-cli-dev-utils'];
        delete packageJson.devDependencies['arco-scripts'];
        delete packageJson.devDependencies['@arco-design/arco-scripts'];
      }

      // handle files
      packageJson.files = ['es', 'lib', 'artifacts'];
      fs.writeJSONSync(packageJsonPath, packageJson, { spaces: 2 });
    }
  }

  private adaptTsconfig() {
    const tsconfigPath = path.join(this.options.path, TSCONFIG_JSON);
    if (fs.existsSync(tsconfigPath)) {
      const tsconfig = fs.readJSONSync(tsconfigPath);
      tsconfig.compilerOptions ||= {};
      delete tsconfig.compilerOptions.declaration;
      fs.writeJSONSync(tsconfigPath, tsconfig, { spaces: 2 });
    }
  }

  private deleteUselessFiles() {
    globSync(
      this.options.uselessFilePatterns.map((filePattern) =>
        path.resolve(this.options.path, filePattern)
      )
    ).forEach((filePath) => fs.removeSync(filePath));
  }

  run() {
    if (!this.options.noEmit) {
      this.adaptPackageJSON();
      this.adaptTsconfig();
      this.deleteUselessFiles();
    }
  }
}
