import type { Component } from '@arco-cli/component';

export interface DocReader {
  /**
   * read a component doc.
   */
  read(path: string, contents: Buffer, component: Component): Promise<any>;

  /**
   * determine which file formats are supported by the doc reader.
   */
  isFormatSupported(ext: string): boolean;
}
