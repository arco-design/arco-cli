import path from 'path';
import fs from 'fs-extra';

import { sync as globSync } from 'glob';
import { PACKAGE_JSON, TSCONFIG_JSON, TIP_CHECK_MIGRATION } from '../constant';
import { AdapterOptions } from '../types';

export type WorkspaceAdapterOptions = AdapterOptions;

export class WorkspaceAdapter {
  private readonly options: WorkspaceAdapterOptions;

  private readonly templateDirPath = path.resolve(
    path.dirname(require.resolve('@arco-cli/generator')),
    'templates/react-workspace'
  );

  private templateFnContext = {
    path: '',
    name: '',
    packageName: '',
    version: '',
    description: '',
  };

  constructor(options: WorkspaceAdapterOptions) {
    this.options = options;

    // init templateFnContext
    this.templateFnContext.path = this.options.path;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const packageInfo = require(path.join(this.options.path, PACKAGE_JSON));
      Object.assign(this.templateFnContext, {
        name: packageInfo.name,
        packageName: packageInfo.name,
        version: packageInfo.version,
        description: packageInfo.description,
      });
    } catch (err) {}
  }

  private adaptPackageJSON() {
    const packageJsonPath = path.join(this.options.path, PACKAGE_JSON);

    if (!fs.existsSync(packageJsonPath)) {
      console.error('No package.json found in the project root directory');
      process.exit(1);
      return;
    }

    const packageJson = fs.readJSONSync(packageJsonPath);

    // handle scripts
    packageJson.scripts ||= {};
    delete packageJson.scripts['add:package'];
    delete packageJson.scripts.generate;
    delete packageJson.scripts.sync;
    delete packageJson.scripts.preview;
    Object.assign(packageJson.scripts, {
      start: 'arco start',
      build: 'arco build',
      test: 'arco test',
      sync: 'arco sync',
    });

    // handle devDependencies
    packageJson.devDependencies ||= {};
    Object.keys(packageJson.devDependencies).forEach((dep) => {
      if (
        dep.endsWith('arco-scripts') ||
        dep.startsWith('@storybook/') ||
        dep.startsWith('enzyme') ||
        [
          'arco-cli',
          'less-loader',
          'react-test-renderer',
          'typescript',
          'typescript-json-schema',
        ].indexOf(dep) > -1
      ) {
        delete packageJson.devDependencies[dep];
      }
    });
    Object.assign(packageJson.devDependencies, {
      '@arco-cli/arco': '^2.0.0-beta.6',
      '@testing-library/dom': '~8',
      '@testing-library/jest-dom': '~5',
      '@testing-library/react': '~12',
      react: '~17',
      'react-dom': '~17',
    });

    // handle lint-staged, remove rules depend on arco-scripts
    // "lint-staged": {
    //   "*.{js,jsx,ts,tsx}": [
    //     "yarn eslint",
    //     "arco-scripts test:node --bail --findRelatedTests --passWithNoTests",
    //     "git add"
    //   ],
    // },
    Object.entries(packageJson['lint-staged'] || {}).forEach(
      ([match, rules]: [string, string | string[]]) => {
        packageJson['lint-staged'][match] = Array.isArray(rules)
          ? rules.filter((rule) => rule.indexOf('arco-scripts') === -1)
          : typeof rules === 'string'
          ? rules.indexOf('arco-scripts') > -1
            ? ''
            : rules
          : rules;
      }
    );

    fs.writeJSONSync(packageJsonPath, packageJson, { spaces: 2 });
  }

  private adaptTsconfig() {
    const tsconfigPath = path.join(this.options.path, TSCONFIG_JSON);

    if (fs.existsSync(tsconfigPath)) {
      const tsconfig = fs.readJSONSync(tsconfigPath);
      tsconfig.compilerOptions ||= {};
      tsconfig.compilerOptions.types = [
        ...tsconfig.compilerOptions.types,
        '@testing-library/jest-dom',
      ];
      fs.writeJSONSync(tsconfigPath, tsconfig, { spaces: 2 });
    }
  }

  private adaptGitIgnore() {
    const configPath = path.join(this.options.path, '.gitignore');

    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath);
      const artifactsDirName = '\nartifacts';
      if (config.indexOf(artifactsDirName) === -1) {
        fs.writeFileSync(
          configPath,
          `${config}

# ${TIP_CHECK_MIGRATION}
# dist file dirs of [arco build] command
# all the dist dirs are [/es, /lib, /artifacts]
# you can update your .gitignore by yourself
${artifactsDirName}`
        );
      }
    }
  }

  private generateProjectFileFromTemplate(options: { filePath: string; prepend?: string }) {
    const { filePath, prepend = '' } = options;
    const tplFilePath = path.join(this.templateDirPath, filePath);

    let fileContents: string | Buffer = null;
    let targetFilePath: string = null;

    // file ends with .tpl.js should execute the tpl function
    if (tplFilePath.endsWith('.tpl.js')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const tplFn = require(tplFilePath).default;
        if (typeof tplFn === 'function') {
          const { filename, contents } = tplFn(this.templateFnContext);
          targetFilePath = path.join(this.options.path, path.dirname(filePath), filename);
          fileContents = contents;
        }
      } catch (err) {
        console.error(`Failed to generate project file\n${err.toString()}`);
      }
    } else {
      fileContents = fs.readFileSync(tplFilePath);
      targetFilePath = path.join(this.options.path, filePath);
    }

    if (!fs.existsSync(targetFilePath)) {
      fs.ensureDirSync(path.dirname(targetFilePath));
      fs.writeFileSync(targetFilePath, `${prepend}${fileContents}`);
    }
  }

  private ejectConfigFiles() {
    // these file paths depend on @arco-cli/generator's templates
    // so the version of @arco-cli/generator is locked in package.json
    const tplFilePathMap = {
      workspaceConfig: 'arco.workspace.jsonc.tpl.js',
      envConfig: 'arco.env.config.js',
      jestConfig: 'jest.config.js',
    };

    Object.entries(tplFilePathMap).forEach(([, filePath]) => {
      this.generateProjectFileFromTemplate({
        filePath,
        prepend:
          filePath === tplFilePathMap.jestConfig
            ? `/**
 * ${TIP_CHECK_MIGRATION}
 * component's Jest config is defined in this file, please move the previous Jest config here
 */
`
            : '',
      });
    });
  }

  private deleteUselessFiles() {
    globSync(
      this.options.uselessFilePatterns.map((filePattern) =>
        path.resolve(this.options.path, filePattern)
      )
    ).forEach((filePath) => fs.removeSync(filePath));
  }

  run() {
    this.adaptPackageJSON();
    this.adaptTsconfig();
    this.adaptGitIgnore();
    this.ejectConfigFiles();
    this.deleteUselessFiles();
  }
}
