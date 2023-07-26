import { sync as globSync } from 'glob';
import fs from 'fs-extra';
import path from 'path';
import { clone } from 'lodash';

import { loadConfig, writeConfig } from './utils';
import type { ComponentInfo, MigratorOptions } from './types';
import { ComponentAdapter } from './adapters/componentAdapter';
import { WorkspaceAdapter } from './adapters/workspaceAdapter';
import { PackageAdapter } from './adapters/packageAdapter';

export class Migrator {
  private readonly options: MigratorOptions;

  private readonly componentDirs: string[] = [];

  private readonly componentInfoList: ComponentInfo[] = [];

  constructor(options: MigratorOptions) {
    this.options = options;
    this.options.root ||= process.cwd();
    this.options.demoDir ||= 'demo';
    this.options.uselessComponentFilePatterns ||= [
      'TEMPLATE.md',
      'README.md',
      'demo',
      '__test__/demo.test.{js,jsx,ts,tsx}',
    ];
    this.options.uselessPackageFilePatterns ||= ['.config', 'stories', 'docs', 'arcoMeta.json'];
    this.options.uselessProjectFilePatterns ||= [
      '.storybook',
      '.config',
      'tests',
      'arco.config.js',
      'arco.scripts.config.js',
    ];

    const { componentDirPatterns } = this.options;
    const componentDirs = globSync(
      (Array.isArray(componentDirPatterns) ? componentDirPatterns : [componentDirPatterns]).map(
        (pattern) => path.resolve(pattern)
      )
    ).filter((dirPath) => fs.lstatSync(dirPath).isDirectory());
    this.componentDirs.push(...componentDirs);
  }

  private generateWorkspaceComponentsConfig(extendsRule: Record<string, any>, members: any[]) {
    const results = [];

    this.componentInfoList.forEach((component) => {
      const [sourceDir, ...restDirs] = component.path
        .replace(component.package.path, '')
        .replace(/^\//, '')
        .split('/');
      const baseDir = `./${restDirs.join('/')}`;
      const componentConfig = {
        rootDir: path.join('./', component.package.path.replace(this.options.root, ''), sourceDir),
        name: component.name,
        author: component.author,
      };

      if (extendsRule.entries?.base !== baseDir) {
        (componentConfig as any).entries = {
          base: baseDir,
        };
      }

      if (
        !members.find(
          (member) =>
            path.resolve(member.rootDir, member.entries?.base || './') ===
            path.resolve(componentConfig.rootDir, (componentConfig as any).entries?.base || './')
        )
      ) {
        results.push(componentConfig);
      }
    });

    return results;
  }

  private registerWorkspaceComponents() {
    const workspaceConfig = loadConfig();
    const aspectKey = 'arco.aspect/workspace';
    const extendsRule = workspaceConfig[aspectKey].components?.extends || {};
    const members = workspaceConfig[aspectKey].components?.members || [];
    const componentConfigList = this.generateWorkspaceComponentsConfig(extendsRule, members);

    writeConfig({
      [aspectKey]: {
        components: {
          extends: extendsRule,
          members: [...members, ...componentConfigList],
        },
      },
    });
  }

  run() {
    // adapt project
    const workspaceAdapter = new WorkspaceAdapter({
      workspaceRoot: this.options.root,
      noEmit: this.options.noEmit,
      path: this.options.root,
      uselessFilePatterns: this.options.uselessProjectFilePatterns,
    });
    workspaceAdapter.run();

    // adapt components
    this.componentDirs.forEach((componentDir) => {
      const adapter = new ComponentAdapter({
        workspaceRoot: this.options.root,
        noEmit: this.options.noEmit,
        path: componentDir,
        demoDir: this.options.demoDir,
        uselessFilePatterns: this.options.uselessComponentFilePatterns,
      });

      this.componentInfoList.push(clone(adapter.info));
      adapter.run();
    });

    // adapt component packages
    [...new Set(this.componentInfoList.map((info) => info.package.path))].forEach((packageDir) => {
      const adapter = new PackageAdapter({
        workspaceRoot: this.options.root,
        noEmit: this.options.noEmit,
        path: packageDir,
        uselessFilePatterns: this.options.uselessPackageFilePatterns,
      });
      adapter.run();
    });

    // register components to workspace config
    this.registerWorkspaceComponents();
  }
}
