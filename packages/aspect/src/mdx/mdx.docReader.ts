import { DocReader, Doc } from '@aspect/docs';

import { compile } from './loader';

export class MDXDocReader implements DocReader {
  constructor(private extensions: string[]) {}

  async read(path: string, contents: Buffer) {
    const output = await compile(contents.toString('utf-8'), {
      filePath: path,
      extractSnippets: true,
    });
    const metadata = output.getMetadata();
    const outline = output.getOutline();
    const snippets = output.getSnippets();

    return Doc.from(path, { ...metadata, outline, snippets });
  }

  isFormatSupported(format: string) {
    return this.extensions.includes(format);
  }
}
