import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';
import doctrine from 'doctrine';
import parseEsImport from 'parse-es-import';

import { loadConfig, writeConfig } from './workspaceConfig';
import { COMPONENT_ROOT, WORKSPACE } from './env';

type ComponentInfo = {
  path: string;
  name: string;
  title?: string;
  description?: string;
  labels?: string[];
  author?: string;
};

type DemoInfo = {
  path: string;
  moduleName: string;
  title?: string;
  description?: string;
};

const DEFAULT_ORIGIN_DEMO_DIR = 'demo';
const DEFAULT_NEW_DEMO_DIR = '__docs__';
const FILE_LIST_TO_REMOVE = ['TEMPLATE.md', 'demo'];

function parseRawComment(fileContent) {
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

function parseDemoModules(entryContent: string): Array<{ path: string; moduleName: string }> {
  // Get demo source code
  const demoInfoList = [];
  const { exports } = parseEsImport(entryContent);

  exports.forEach(({ type, moduleName, value }) => {
    switch (type) {
      case 'ExportSpecifier':
        demoInfoList.push({
          path: value,
          moduleName,
        });
        break;

      default:
        break;
    }
  });

  return demoInfoList;
}

function generateDocEntry(componentInfo: ComponentInfo, demoInfo: DemoInfo[]) {
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

  const importStatement = `import '../style';
${demoInfo.map((info) => `import ${info.moduleName} from '${info.path}';`).join('\n')}`;

  const docContent = demoInfo
    .map((info, index) => {
      return `# ${info.title || `Demo ${index}`}${info.description ? `\n\n${info.description}` : ''}

<div data-arco-demo="${info.moduleName}">
  <${info.moduleName}/>
</div>`;
    })
    .join('\n\n');

  return `${markdownMeta}\n\n${importStatement}\n\n${docContent}`;
}

function generateComponentConfig(component: ComponentInfo) {
  const relativePath = path.relative(WORKSPACE, component.path);
  const rootDir = COMPONENT_ROOT || relativePath;
  return {
    rootDir,
    name: component.name,
    author: component.author,
    entries: {
      base: `./${path.relative(path.resolve(WORKSPACE, COMPONENT_ROOT), component.path)}`,
    },
  };
}

export default function migrate(componentDirPattern: string, skipWriteFile = false) {
  const componentDirs = glob.sync(path.resolve(componentDirPattern));
  const componentConfigList = [];

  componentDirs.forEach((componentDir) => {
    const componentName = componentDir
      .split('/')
      .pop()
      .replace(/^\w/, (match) => match.toUpperCase());
    const originDemoDir = path.resolve(componentDir, DEFAULT_ORIGIN_DEMO_DIR);
    const originDemoEntry = path.resolve(originDemoDir, 'index.js');
    const targetDemoDir = path.resolve(componentDir, DEFAULT_NEW_DEMO_DIR);
    const targetDemoEntry = path.resolve(targetDemoDir, 'index.mdx');

    if (!fs.existsSync(originDemoEntry)) {
      return;
    }

    const originDemoContent = fs.readFileSync(originDemoEntry, 'utf8');
    const commentList = parseRawComment(originDemoContent);
    const demoModules = parseDemoModules(originDemoContent);
    let componentInfo: ComponentInfo = null;
    const demoInfo: DemoInfo[] = [];

    for (const comment of commentList) {
      const { kind, title, description, memberOf, memberof, author } = comment;
      if (kind === 'file') {
        componentInfo = {
          path: componentDir,
          name: componentName,
          title,
          description,
          author,
          labels: [memberOf || memberof],
        };
      }
      if (kind === 'member') {
        const module = demoModules.shift();
        demoInfo.push({
          moduleName: module.moduleName,
          path: module.path,
          title,
          description,
        });
      }
    }

    const newDocContent = generateDocEntry(componentInfo, demoInfo);

    if (!skipWriteFile) {
      fs.copySync(originDemoDir, targetDemoDir);
      fs.writeFileSync(targetDemoEntry, newDocContent);
      FILE_LIST_TO_REMOVE.forEach((filePath) => {
        fs.removeSync(path.resolve(componentDir, filePath));
      });
    }

    componentConfigList.push(generateComponentConfig(componentInfo));
  });

  const workspaceConfig = loadConfig();
  const aspectKey = 'arco.aspect/workspace';

  writeConfig({
    [aspectKey]: {
      ...workspaceConfig[aspectKey],
      components: [...(workspaceConfig[aspectKey].components || []), ...componentConfigList],
    },
  });
}
