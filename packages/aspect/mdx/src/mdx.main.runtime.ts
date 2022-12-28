import { MainRuntime } from '@arco-cli/cli';
import { DocsAspect, DocsMain } from '@arco-cli/docs';

import MDXAspect from './mdx.aspect';
import { MDXDocReader } from './mdx.docReader';

export type MDXConfig = {
  /**
   * list of file extensions to consider as MDX files.
   */
  extensions: string[];
};

export class MDXMain {
  static runtime = MainRuntime;

  static dependencies = [DocsAspect];

  static slots = [];

  static defaultConfig = {
    extensions: ['.md', '.mdx'],
  };

  static provider([docs]: [DocsMain], config: MDXConfig) {
    const mdxMain = new MDXMain();
    docs.registerDocReader(new MDXDocReader(config.extensions));
    return mdxMain;
  }

  constructor() {}
}

MDXAspect.addRuntime(MDXMain);
