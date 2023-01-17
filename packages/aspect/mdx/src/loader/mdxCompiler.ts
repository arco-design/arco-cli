import path from 'path';
import yaml from 'yaml';
import glob from 'glob';
import vfile from 'vfile';
import fs from 'fs-extra';
import mdx from '@mdx-js/mdx';
import detectFrontmatter from 'remark-frontmatter';
import visit from 'unist-util-visit';
import remove from 'unist-util-remove';
import remarkNotes from 'remark-admonitions';
import { detectiveEs6 } from '@arco-cli/legacy/dist/workspace/component/dependencies/detectives';

import { CompileOutput } from './compileOutput';
import { ImportSpecifier } from './importSpecifier';

export type MDXCompileOptions = {
  remarkPlugins: any[];
  rehypePlugins: any[];
  compilers: any[];
  filepath?: string;
  renderer: string;
  arcoFlavour: boolean;
};

// these components name come from @arco-cli/ui-foundation-react/dist/markdown/components
// can not import from package above, because that's a pure ESM package
const COMPONENT_NAME_DEMO_VIEW = 'ArcoDemoView';
const COMPONENT_NAME_DOC_ANCHOR = 'ArcoDocAnchor';

const DEFAULT_RENDERER = `
// @ts-nocheck
import React from 'react'
import { mdx } from '@mdx-js/react'

/* @jsxRuntime classic */
/* @jsx mdx */
`;

const DEFAULT_OPTIONS: Partial<MDXCompileOptions> = {
  remarkPlugins: [remarkNotes],
  compilers: [],
  renderer: DEFAULT_RENDERER,
  arcoFlavour: true,
};

/**
 * compile a mdx file with frontmatter formatted (yaml) metadata.
 * example:
 * ```
 * ---
 * title: Something
 * labels: ['some', 'labels']
 * ---
 * ```
 */
export function compile(
  content: string,
  options: Partial<MDXCompileOptions> = {}
): Promise<CompileOutput> {
  const contentFile = getFile(content, options.filepath);
  return new Promise((resolve, reject) => {
    const mdxCompiler = createCompiler(options);
    mdxCompiler.process(contentFile, (err: Error | undefined, file: any) => {
      if (err) return reject(err);
      const output = new CompileOutput(file, DEFAULT_RENDERER);
      return resolve(output);
    });
  });
}

/**
 * sync compilation of mdx content.
 */
export function compileSync(
  mdxContent: string,
  options: Partial<MDXCompileOptions> = {}
): CompileOutput {
  const contentFile = getFile(mdxContent, options.filepath);
  const mdxCompiler = createCompiler(options);
  const file = mdxCompiler.processSync(contentFile);
  return new CompileOutput(file, DEFAULT_RENDERER);
}

function getFile(contents: string, path?: string) {
  return path ? vfile({ contents, path }) : vfile(contents);
}

function createCompiler(opts: Partial<MDXCompileOptions>) {
  const options = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };
  const mustPlugins = options.arcoFlavour
    ? [
        [detectFrontmatter, ['yaml']],
        extractMetadata,
        extractImports,
        extractHeadings,
        extractComponentDemos,
      ]
    : [extractImports];
  const mustRehypePlugins = [];

  const compilerOpts = Object.assign(options, {
    remarkPlugins: options.remarkPlugins ? mustPlugins.concat(options.remarkPlugins) : mustPlugins,
    rehypePlugins: options.rehypePlugins
      ? mustRehypePlugins.concat(options.rehypePlugins)
      : mustRehypePlugins,
  });

  return mdx.createCompiler(compilerOpts);
}

function extractMetadata() {
  return function transformer(tree, file) {
    visit(tree, 'yaml', (node: any) => {
      try {
        file.data.frontmatter = yaml.parse(node.value, { prettyErrors: true });
      } catch (err: any) {
        throw new Error(
          `failed extracting metadata/front-matter using Yaml lib, due to an error (please disregard the line/column): ${err.message}`
        );
      }
    });

    remove(tree, 'yaml');
  };
}

function extractImports() {
  return function transformer(tree, file) {
    visit(tree, 'import', (node: any) => {
      const es6Import = detectiveEs6(node.value);
      const imports: ImportSpecifier[] = Object.keys(es6Import).flatMap((dep) => {
        if (!es6Import[dep].importSpecifiers) {
          return {
            fromModule: dep,
          };
        }
        return es6Import[dep].importSpecifiers.map((importSpecifier) => ({
          fromModule: dep,
          identifier: importSpecifier.name,
          isDefault: importSpecifier.isDefault,
        }));
      });
      (file.data.imports ||= []).push(...imports);
    });
  };
}

function extractHeadings() {
  const headings = [];
  const getHeadingText = (node, text = '') => {
    const nodeTypeHasTextValue = ['inlineCode', 'text'];
    if (Array.isArray(node.children)) {
      for (const c of node.children) {
        text += getHeadingText(c);
      }
    } else if (nodeTypeHasTextValue.indexOf(node.type) > -1) {
      text += node.value;
    }
    return text;
  };

  return function transformer(tree, file) {
    visit(tree, 'heading', (node: any) => {
      const text = getHeadingText(node);
      const heading = {
        text,
        depth: node.depth,
      };
      headings.push(heading);
    });

    file.data.headings = headings;
    tree.children.push({
      type: 'jsx',
      value: `<${COMPONENT_NAME_DOC_ANCHOR} outlineJsonStr={\`${JSON.stringify(headings)}\`} />`,
    });
  };
}

function extractComponentDemos() {
  return function transformer(tree, file) {
    const imports = file.data.imports || [];

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
          node.value = `<${COMPONENT_NAME_DEMO_VIEW} code={\`${demoCode}\`} children={${node.value}} />`;
        }
      }
    });
  };
}
