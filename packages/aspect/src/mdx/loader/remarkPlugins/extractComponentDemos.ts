// TODO try to solve it: demo file content updating won't trigger mdx compiling, then code-text won't update
import visit from 'unist-util-visit';
import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';

export function extractComponentDemos(demoViewComponentName: string) {
  return function transformer(tree, file) {
    const imports = file.data.imports || [];

    if (!demoViewComponentName) return;

    // this will visit div like below
    // <div data-arco-demo="BasicDemo">...anything from user</div>
    visit(tree, 'jsx', (node: any) => {
      if (/^<div/i.test(node.value)) {
        const [, attribute] = node.value.match(/^<div([^>]*)>/i) || [];
        const metadata: { demo?: string } = {};

        (attribute || '').replace(/data-arco-(\w+)="([^"]+)"/i, (_, key, value) => {
          metadata[key] = value;
          return '';
        });

        let demoCode = '';
        for (const { identifier, fromModule } of imports) {
          if (identifier === metadata.demo) {
            let demoPath = path.join(file.dirname, fromModule);
            if (!/\.[jt]sx?$/.test(demoPath)) {
              const [globPath] = glob.sync(`${demoPath}.*`);
              demoPath = globPath || demoPath;
            }
            try {
              demoCode = fs.readFileSync(demoPath).toString();
            } catch (e) {}

            break;
          }
        }

        if (metadata.demo) {
          const encoder = new TextEncoder();
          node.value = `<${demoViewComponentName} children={${
            node.value
          }}  code={{ needDecode: true, value: '${encoder.encode(demoCode)}' }} />`;
        }
      }
    });
  };
}
