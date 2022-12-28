import { DocReader, Doc } from '@arco-cli/docs';
import { compile } from './loader';

export class MDXDocReader implements DocReader {
  constructor(private extensions: string[]) {}

  async read(path: string, contents: Buffer) {
    const output = await compile(contents.toString('utf-8'), { filepath: path });
    const metadata = output.getMetadata();
    const outline = output.getOutline();

    return Doc.from(path, { ...metadata, outline });
  }

  isFormatSupported(format: string) {
    return this.extensions.includes(format);
  }
}
