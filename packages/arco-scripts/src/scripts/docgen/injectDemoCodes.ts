import fs from 'fs-extra';
import doctrine from 'doctrine';
import parseEsImport from 'parse-es-import';
import { getRealRequirePath } from '@arco-design/arco-dev-utils';

type DemoInfo = {
  content: string;
  isTS: boolean;
};

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

export default function injectDemoCodes({
  demoEntries,
  markdownBody,
  placeholder,
}: {
  /** Path of demo entries */
  demoEntries: string[];
  /** Content of markdown */
  markdownBody: string;
  /** Placeholder for demos */
  placeholder: string;
}) {
  if (markdownBody.indexOf(placeholder) === -1) {
    return markdownBody;
  }

  // Single entry
  if (demoEntries.length === 1 && demoEntries[0].endsWith('js')) {
    const entryPoint = demoEntries[0];
    const entryContent = fs.readFileSync(entryPoint, 'utf8');

    // Get demo source code
    const demoInfoList: DemoInfo[] = [];
    const { exports } = parseEsImport(entryContent);

    const getDemoInfo = (moduleName: string): DemoInfo => {
      const [requirePath] = getRealRequirePath(moduleName, entryPoint);

      if (requirePath) {
        return {
          content: fs.readFileSync(requirePath, 'utf8'),
          isTS: !!requirePath.match(/.tsx?$/),
        };
      }

      return null;
    };

    exports.forEach(({ type, moduleName, value }) => {
      switch (type) {
        case 'ExportSpecifier':
          const demoInfo = getDemoInfo(value);
          demoInfo && demoInfoList.push(demoInfo);
          break;

        case 'FunctionDeclaration':
          demoInfoList.push({
            content: value,
            isTS: false,
          });
          break;

        case 'VariableDeclaration':
          demoInfoList.push({
            content: `const ${moduleName} = ${value}`,
            isTS: false,
          });
          break;

        default:
          break;
      }
    });

    // Get comment
    const commentList = parseRawComment(entryContent);
    const commentStr = `\n~~~json type=description\n${JSON.stringify(commentList, null, 2)}\n~~~\n`;
    const demoStr = demoInfoList
      .map(({ content, isTS }) => `\n~~~${isTS ? 't' : 'j'}sx\n${content}\n~~~\n`)
      .join('');
    return markdownBody.replace(placeholder, `${commentStr}${demoStr}`);
  }

  const demos = demoEntries.map((path) => `\n~~~jsx\n${fs.readFileSync(path, 'utf8')}\n~~~\n`);
  return markdownBody.replace(placeholder, demos.join(''));
}
