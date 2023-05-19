import vfile from 'vfile';
import mdx from '@mdx-js/mdx';
import detectFrontmatter from 'remark-frontmatter';
import remarkNotes from 'remark-admonitions';

import {
  extractComponentDemos,
  extractHeadings,
  extractImports,
  extractMetadata,
} from './remarkPlugins';
import { CompileOutput } from './compileOutput';

export type MDXCompilerOptions = {
  remarkPlugins: any[];
  rehypePlugins: any[];
  compilers: any[];
  filePath?: string;
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

const DEFAULT_OPTIONS: Partial<MDXCompilerOptions> = {
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
  options: Partial<MDXCompilerOptions> = {}
): Promise<CompileOutput> {
  const contentFile = getFile(content, options.filePath);
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
  options: Partial<MDXCompilerOptions> = {}
): CompileOutput {
  const contentFile = getFile(mdxContent, options.filePath);
  const mdxCompiler = createCompiler(options);
  const file = mdxCompiler.processSync(contentFile);
  return new CompileOutput(file, DEFAULT_RENDERER);
}

function getFile(contents: string, path?: string) {
  return path ? vfile({ contents, path }) : vfile(contents);
}

function createCompiler(opts: Partial<MDXCompilerOptions>) {
  const options = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };
  const mustPlugins = options.arcoFlavour
    ? [
        [detectFrontmatter, ['yaml']],
        extractMetadata,
        extractImports,
        extractHeadings.bind(null, COMPONENT_NAME_DOC_ANCHOR),
        extractComponentDemos.bind(null, COMPONENT_NAME_DEMO_VIEW),
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
