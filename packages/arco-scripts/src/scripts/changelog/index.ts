import fs from 'fs-extra';
import axios from 'axios';
import inquirer from 'inquirer';
import moment from 'moment';
import { configure } from 'nunjucks';
import { compareVersion, isValidComponent } from './utils';

const nunjucksEnv = configure(__dirname, {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true,
});

interface Changelog {
  version: string;
  date: string;
  list: Record<string, any>[];
}

interface EmitInfo {
  filename: string;
  template: string;
  data: any;
}

const typeMap: Record<string, string> = {
  'New feature': 'feature',
  'Bug fix': 'bugfix',
  Refactoring: 'refactor',
  'Component style change': 'style',
  Enhancement: 'enhancement',
  'Performance improvement': 'enhancement',
  'Typescript definition change': 'typescript',
  'Breaking change': 'attention',
};

const getRecords = (mr: any) => {
  const content: string = mr.body.replace(/\r\n/g, '\n');

  const records: Array<Record<string, any>> = [];

  const typeRule = new RegExp('##\\s+Types of changes.+?\\[[xX]]\\s+(.+?)\\n', 's');

  const typeString = (content.match(typeRule)?.[1] ?? '').trim();

  const type = typeString && typeMap[typeString];

  const rule = new RegExp(
    // Table title
    '##\\s+Changelog\\n\\n' +
      // Table title
      '\\s*\\|(.+)\\|\\s*\\n' +
      // Alignment info
      '\\s*\\|(?:[-: ]+[-| :]*)\\|\\s*\\n' +
      // Table content
      '((?:\\s*\\|.*\\|\\s*(?:\\n|$))*)'
  );

  const matchResult = content.match(rule);
  if (matchResult) {
    const titles = matchResult[1].split('|').map((item: string) => item.toLowerCase().trim());
    const lines = matchResult[2].split('\n').filter((value: string) => Boolean(value.trim()));
    for (const line of lines) {
      const items = line
        .split('|')
        .slice(1)
        .map((value: string) => value.trim());
      const data = titles.reduce(
        (data: Record<string, any>, title: string, index: number) => {
          switch (title) {
            case 'type':
              if (items[index] && typeMap[items[index]]) {
                data[title] = typeMap[items[index]];
              }
              break;
            case 'related issues': {
              const match = (items[index] ?? '').match(/#\d+/g);
              if (match) {
                data.issue = match.map((item: string) => item.slice(1));
              }
              break;
            }
            default:
              data[title] = items[index];
          }
          return data;
        },
        {
          mrId: mr.number,
          mrURL: mr.html_url,
          type,
        } as Record<string, any>
      );
      records.push(data);
    }
  }

  return records;
};

const addAll = (data: any, changelog: any) => {
  if (!changelog[data.type]) {
    changelog[data.type] = [];
  }
  changelog[data.type].push(data.content);
};

const addComponent = (data: any, changelog: any) => {
  const component = data.component || 'common';
  if (!changelog[component]) {
    changelog[component] = {};
  }
  if (!changelog[component][data.type]) {
    changelog[component][data.type] = [];
  }
  changelog[component][data.type].push(data.content);
};

const deleteChangelog = (filename: string, versions: string[]) => {
  const content = fs.readFileSync(filename, 'utf8');
  const reg = new RegExp(
    `## (${versions.join('|').replace(/\./g, '\\.')}).+?(?=## \\d+\\.\\d+\\.\\d+(-beta\\.\\d+)?)`,
    'gs'
  );
  const result = content.replace(reg, '');
  fs.writeFileSync(filename, result);
};

const getEmitsFromChangelog = async (changelog: Changelog): Promise<EmitInfo[]> => {
  const allCN = {};
  const addEN = {};
  const componentCN: Record<string, any> = {};
  const componentEN: Record<string, any> = {};

  for (const item of changelog.list) {
    if (!isValidComponent(item.component)) {
      // eslint-disable-next-line no-await-in-loop
      const answer = await inquirer.prompt({
        type: 'input',
        name: 'component',
        message: `The component name '${item.component}' is invalid, please input the new name.[${item.mrId}]`,
        validate(input: any) {
          return isValidComponent(input);
        },
      });
      item.component = answer.component;
    }

    const contentCN = `${item['changelog(cn)']}([#${item.mrId}](${item.mrURL}))`;
    const contentEN = `${item['changelog(en)']}([#${item.mrId}](${item.mrURL}))`;
    addAll({ ...item, content: contentCN }, allCN);
    addAll({ ...item, content: contentEN }, addEN);
    addComponent({ ...item, content: contentCN }, componentCN);
    addComponent({ ...item, content: contentEN }, componentEN);
  }

  const emits: EmitInfo[] = [
    {
      filename: 'site/docs/version_v2.zh-CN.md',
      template: 'template/main.zh-CN.njk',
      data: { version: changelog.version, date: changelog.date, ...allCN },
    },
    {
      filename: 'site/docs/version_v2.en-US.md',
      template: 'template/main.en-US.njk',
      data: { version: changelog.version, date: changelog.date, ...addEN },
    },
  ];

  for (const component of Object.keys(componentCN)) {
    let filepath = `components/${component}/__changelog__/index.zh-CN.md`;
    if (/common/i.test(component)) {
      filepath = 'site/docs/changelog.common.zh-CN.md';
    } else if (/icon/.test(component)) {
      filepath = 'site/src/pages/icon/md/__changelog__/index.zh-CN.md';
    }
    emits.push({
      filename: filepath,
      template: 'template/main.zh-CN.njk',
      data: {
        version: changelog.version,
        date: changelog.date,
        ...componentCN[component],
      },
    });
  }
  for (const component of Object.keys(componentEN)) {
    let filepath = `./components/${component}/__changelog__/index.en-US.md`;
    if (/common/i.test(component)) {
      filepath = 'site/docs/changelog.common.en-US.md';
    } else if (/icon/.test(component)) {
      filepath = 'site/src/pages/icon/md/__changelog__/index.en-US.md';
    }
    emits.push({
      filename: filepath,
      template: 'template/main.en-US.njk',
      data: {
        version: changelog.version,
        date: changelog.date,
        ...componentEN[component],
      },
    });
  }

  return emits;
};

const appendChangelog = (emit: EmitInfo) => {
  const { filename, template, data } = emit;
  const content = nunjucksEnv.render(template, data);
  try {
    fs.accessSync(filename);
    const origin = fs.readFileSync(filename, 'utf8');
    let originContent = origin;
    let hasFm = false;
    if (origin.match(/^---\nchangelog:\s*true\n---\n\n/)) {
      hasFm = true;
      originContent = origin.replace(/^---\nchangelog:\s*true\n---\n\n/, '');
    }
    const result = (hasFm ? '---\nchangelog: true\n---\n\n' : '') + content + originContent;

    fs.writeFileSync(filename, result);
  } catch {
    fs.writeFileSync(filename, content);
  }
};

const getLastVersion = (content: string) => {
  const match = content.match(/## (\d+\.\d+\.\d+(-beta\.\d+)?)/);
  if (match) {
    return match[1];
  }
};

const getBetaVersions = (content: string) => {
  const matches = Array.from(content.matchAll(/## (\d+\.\d+\.\d+(-beta\.\d+)?)/g));
  const versions = [];
  for (const item of matches) {
    if (/beta/.test(item[1])) {
      versions.push(item[1]);
    } else {
      break;
    }
  }
  return versions;
};

const run = async () => {
  let version;
  if (fs.existsSync('package.json')) {
    try {
      const packageJson = await fs.readFile('package.json', 'utf8');
      const packageData = JSON.parse(packageJson);
      if (packageData.version) {
        version = packageData.version;
      }
    } catch {
      console.log('read version from package.json has error');
    }
  }

  const answer = await inquirer.prompt({
    type: 'input',
    name: 'version',
    message: 'Please input the version',
    default: version,
    validate(input: any) {
      return /\d+\.\d+\.\d+(-beta\.\d+)?/.test(input);
    },
  });

  version = answer.version;

  const currentContent = fs.readFileSync('site/docs/version_v2.zh-CN.md', 'utf8');
  const lastVersion = getLastVersion(currentContent);

  let needMerge = false;

  if (version === lastVersion || compareVersion(version, lastVersion) < 1) {
    const answer = await inquirer.prompt({
      type: 'input',
      name: 'version',
      message: `This version is already existed or lower than last version, please reenter`,
      validate(input: any) {
        return /\d+\.\d+\.\d+(-beta\.\d+)?/.test(input) && input !== lastVersion;
      },
    });
    version = answer.version;
  }

  if (/beta/.test(lastVersion)) {
    const answer = await inquirer.prompt({
      type: 'confirm',
      name: 'merge',
      message: `This last version is a beta, is need to merge?`,
    });
    needMerge = answer.merge;
  }

  const res = await axios.get(
    `https://api.github.com/search/issues?accept=application/vnd.github.v3+json&q=repo:arco-design/arco-design+is:pr+is:merged+milestone:${version}`
  );

  if (res.status === 200) {
    let { data } = res;
    data = data?.items;

    if (needMerge) {
      const betaVersions = getBetaVersions(currentContent);

      console.log(
        `there are ${betaVersions.length} version need to merge: ${betaVersions.join(',')}`
      );

      const files = new Set(['site/docs/version_v2.zh-CN.md', 'site/docs/version_v2.en-US.md']);
      for (const betaVersion of betaVersions) {
        // eslint-disable-next-line no-await-in-loop
        const res2 = await axios.get(
          `https://api.github.com/search/issues?accept=application/vnd.github.v3+json&q=repo:arco-design/arco-design+is:pr+is:merged+milestone:${betaVersion}`
        );
        if (res2.status === 200) {
          data = data.concat(res2.data?.items ?? []);
          for (const item of res2.data?.items ?? []) {
            const records = getRecords(item);
            for (const record of records) {
              let component = record.component;
              if (!isValidComponent(component)) {
                // eslint-disable-next-line no-await-in-loop
                const answer = await inquirer.prompt({
                  type: 'input',
                  name: 'component',
                  message: `The component name '${component}' is invalid, please input the new name.[${record.mrId}]`,
                  validate(input: any) {
                    return isValidComponent(input);
                  },
                });
                component = answer.component;
              }
              let filepath = `components/${component}/__changelog__/index.zh-CN.md`;
              if (/common/i.test(component)) {
                filepath = 'site/docs/changelog.common.zh-CN.md';
              } else if (/icon/.test(component)) {
                filepath = 'site/src/pages/icon/md/__changelog__/index.zh-CN.md';
              }
              let filepath2 = `./components/${component}/__changelog__/index.en-US.md`;
              if (/common/i.test(component)) {
                filepath2 = 'site/docs/changelog.common.en-US.md';
              } else if (/icon/.test(component)) {
                filepath2 = 'site/src/pages/icon/md/__changelog__/index.en-US.md';
              }
              files.add(filepath);
              files.add(filepath2);
            }
          }
        }
      }
      files.forEach((file) => deleteChangelog(file, betaVersions));
    }

    const changelog = {
      version,
      date: moment().format('YYYY-MM-DD'),
      list: [] as Record<string, any>[],
    };
    for (const item of data) {
      const records = getRecords(item);
      changelog.list.push(...records);
    }

    if (changelog.list.length > 0) {
      const emits = await getEmitsFromChangelog(changelog);

      for (const item of emits) {
        // eslint-disable-next-line no-await-in-loop
        await appendChangelog(item);
      }
    } else {
      console.log('No update information found');
    }
  }
};

export default run;
