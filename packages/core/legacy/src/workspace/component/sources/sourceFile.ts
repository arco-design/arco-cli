import R from 'ramda';
import vinylFile from 'vinyl-file';
import AbstractVinyl from './abstractVinyl';
import logger from '../../../logger/logger';
import { FileSourceNotFoundError } from '../exceptions';

export default class SourceFile extends AbstractVinyl {
  static load(
    filePath: string,
    base: string,
    consumerPath: string,
    extendedProps: Record<string, any>
  ): SourceFile {
    try {
      const file = new SourceFile(vinylFile.readSync(filePath, { base, cwd: consumerPath }));
      const addToFile = (value, key) => {
        file[key] = value;
      };
      R.forEachObjIndexed(addToFile, extendedProps);
      return file;
    } catch (err: any) {
      logger.errorAndAddBreadCrumb(
        'source-file.load',
        'failed loading file {filePath}. Error: {message}',
        { filePath, message: err.message },
        err
      );
      if (err.code === 'ENOENT' && err.path) {
        throw new FileSourceNotFoundError(err.path);
      }
      throw err;
    }
  }

  static loadFromParsedString(parsedString: Record<string, any>): SourceFile | null {
    if (!parsedString) return null;
    const opts = super.loadFromParsedStringBase(parsedString);
    return new SourceFile(opts);
  }

  static loadFromParsedStringArray(arr: Record<string, any>[]): SourceFile[] | null | undefined {
    if (!arr) return null;
    return arr.map(this.loadFromParsedString);
  }

  clone(): this {
    // @ts-ignore
    return new SourceFile(this);
  }
}
