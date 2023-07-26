import path from 'path';
import { sync as globSync } from 'glob';
import fs from 'fs-extra';
import doctrine from 'doctrine';
import parseEsImport from 'parse-es-import';

import { PACKAGE_JSON } from '../constant';
import { AdapterOptions, ComponentInfo } from '../types';
import { buildPropagationPaths } from '../utils';

const DEFAULT_NEW_DEMO_DIR = '__docs__';

export interface ComponentAdapterOptions extends AdapterOptions {
  demoDir: string;
}

type DemoInfo = { path: string; moduleName: string; isDefault?: boolean };

export class ComponentAdapter {
  static parseDemoModules(entryContent: string): DemoInfo[] {
    // Get demo source code
    const demoInfoList: DemoInfo[] = [];
    const { exports } = parseEsImport(entryContent);

    exports.forEach(({ type, moduleName, value, startIndex, endIndex }) => {
      switch (type) {
        case 'ExportSpecifier': {
          const statement = entryContent.slice(startIndex, endIndex);
          demoInfoList.push({
            path: value,
            moduleName,
            isDefault: /default\s+as\s+/.test(statement),
          });
          break;
        }

        default:
          break;
      }
    });

    return demoInfoList;
  }

  static parseRawComment(fileContent) {
    const commentList = [];
    fileContent.replace(/\/\*{2}\s*\n(\s*\*.*\n)+\s*\*\//g, (match) => {
      const comment = {
        kind: 'member',
      };

      doctrine
        .parse(match, { unwrap: true, recoverable: true })
        .tags.forEach(({ title, name, description }) => {
          const value = name || description;
          if (value) {
            comment[title] = value;
          }
          if (title === 'file') {
            comment.kind = 'file';
          }
        });

      commentList.push(comment);
    });

    return commentList;
  }

  static parseComponentInfo(workspaceRoot: string, componentDir: string, demoDir: string) {
    const componentName = componentDir
      .split('/')
      .pop()
      .replace(/^\w/, (match) => match.toUpperCase());
    const componentInfo: ComponentInfo = {
      path: componentDir,
      name: componentName,
      demos: [],
      package: {
        path: '',
      },
    };

    // get package dir of current component
    const dirsToSearchPkgJson = buildPropagationPaths(componentDir, workspaceRoot);
    for (const dirPath of dirsToSearchPkgJson) {
      const packageJsonPath = path.join(dirPath, PACKAGE_JSON);
      if (fs.existsSync(packageJsonPath)) {
        componentInfo.package.path = dirPath;
        // component dir has a relative path like src/
        if (componentDir.replace(path.join(dirPath, '/'), '').split('/').length === 1) {
          const packageJson = fs.readJSONSync(packageJsonPath);
          // transform name from package-name to PackageName
          componentInfo.name = packageJson.name
            .split('/')
            .pop()
            .replace(/(^\w)|(-\w)/g, (match) => match.replace('-', '').toUpperCase());
        }
        break;
      }
    }

    // parse demo infos of current component
    const originDemoDir = path.resolve(componentDir, demoDir);
    const [originDemoEntry] = globSync(path.resolve(originDemoDir, 'index.{js,ts,jsx,tsx}'));
    if (originDemoEntry) {
      const originDemoContent = fs.readFileSync(originDemoEntry, 'utf8');
      const commentList = ComponentAdapter.parseRawComment(originDemoContent);
      const demoModules: DemoInfo[] = [];
      try {
        demoModules.push(...ComponentAdapter.parseDemoModules(originDemoContent));
      } catch (err) {
        console.error(
          `Failed to parse component demos from ${originDemoEntry}.\n${err.toString()}`
        );
      }

      for (const comment of commentList) {
        const { kind, title, description, memberOf, memberof, author } = comment;
        if (kind === 'file') {
          Object.assign(componentInfo, {
            title,
            description,
            author,
            labels: [memberOf || memberof],
          });
        }
        if (kind === 'member') {
          const module = demoModules.shift();
          componentInfo.demos.push({
            moduleName: module.moduleName,
            path: module.path,
            isDefault: module.isDefault,
            title,
            description,
          });
        }
      }
    }

    return componentInfo;
  }

  private readonly options: ComponentAdapterOptions;

  public readonly info: ComponentInfo = null;

  constructor(options: ComponentAdapterOptions) {
    this.options = options;
    this.info = ComponentAdapter.parseComponentInfo(
      options.workspaceRoot,
      options.path,
      options.demoDir
    );
  }

  private generateNewDocEntry() {
    const componentInfo = this.info;
    const markdownMeta = `---
${componentInfo.title ? `title: ${componentInfo.title}\n` : ''}${
      componentInfo.description
        ? `description: ${componentInfo.description.replace(/[\n\r]/g, ' ')}\n`
        : ''
    }${
      componentInfo.labels?.length
        ? `labels: [${componentInfo.labels.map((label) => `'${label}'`).join(', ')}]`
        : ''
    }
---`;

    const importStatement = `${componentInfo.demos
      .map(
        (info) =>
          `import ${info.isDefault ? info.moduleName : `{ ${info.moduleName} }`} from '${
            info.path
          }';`
      )
      .join('\n')}`;

    const docContent = componentInfo.demos
      .map((info, index) => {
        return `# ${info.title || `Demo ${index}`}${
          info.description ? `\n\n${info.description}` : ''
        }

<div data-arco-demo="${info.moduleName}">
  <${info.moduleName}/>
</div>`;
      })
      .join('\n\n');

    return `${markdownMeta}\n\n${importStatement}\n\n${docContent}`;
  }

  private adaptDemos() {
    const { path: componentDir } = this.info;
    const originDemoDir = path.resolve(componentDir, this.options.demoDir);
    if (fs.existsSync(originDemoDir)) {
      const targetDemoDir = path.resolve(componentDir, DEFAULT_NEW_DEMO_DIR);
      const targetDemoEntry = path.resolve(targetDemoDir, 'index.mdx');
      const newDocContent = this.generateNewDocEntry();

      fs.copySync(originDemoDir, targetDemoDir, {
        filter: (filePath) => !/^\/?index\.[jt]sx?$/.test(filePath.replace(originDemoDir, '')),
      });
      fs.writeFileSync(targetDemoEntry, newDocContent);
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
      this.adaptDemos();
      this.deleteUselessFiles();
    }
  }
}
