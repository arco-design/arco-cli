import fs from 'fs-extra';
import Vinyl from 'vinyl';
import * as path from 'path';

import { FileConstructor } from './vinylTypes';
import { eol } from '../../../utils';
import logger from '../../../logger/logger';

type AbstractVinylProps = {
  cwd: string;
  path: string;
  base: string;
  contents: Buffer;
};

export default class AbstractVinyl extends (Vinyl as FileConstructor) {
  override = true;

  verbose = false;

  static fromVinyl(vinyl: Vinyl): AbstractVinyl {
    if (vinyl instanceof AbstractVinyl) return vinyl;
    return new AbstractVinyl(vinyl);
  }

  get relativeDir() {
    return path.dirname(this.relative);
  }

  // Update the base path and keep the relative value to be the same
  updatePaths({
    newBase,
    newRelative,
    newCwd,
  }: {
    newBase?: string;
    newRelative?: string;
    newCwd?: string;
  }) {
    const relative = newRelative || this.relative;
    const base = newBase || this.base;
    if (newCwd) this.cwd = newCwd;
    this.base = base;
    this.path = path.join(this.base, relative);
  }

  async write(
    writePath?: string,
    override: boolean = this.override,
    verbose: boolean = this.verbose
  ): Promise<string | null | undefined> {
    const filePath = writePath || this.path;
    const msg = _verboseMsg(filePath, override);
    if (verbose) {
      console.log(msg);
    }
    logger.debug(msg);
    if (!override && fs.existsSync(filePath)) return null;
    await fs.outputFile(filePath, eol.auto(this.contents));
    return filePath;
  }

  toReadableString() {
    return {
      relativePath: this.relative,
      content: this.contents.toString(),
    };
  }

  static loadFromParsedStringBase(parsedString: any): AbstractVinylProps {
    const contents = Buffer.isBuffer(parsedString._contents)
      ? parsedString._contents
      : Buffer.from(parsedString._contents);
    return {
      cwd: parsedString._cwd,
      path: parsedString.history[parsedString.history.length - 1],
      base: parsedString._base,
      contents,
    };
  }

  async _getStatIfFileExists(): Promise<fs.Stats | null | undefined> {
    try {
      return await fs.lstat(this.path);
    } catch (err: any) {
      return null; // probably file does not exist
    }
  }
}

/**
 * Generate message for the logs and for output in case of verbose
 * this function is exported for testing purposes
 */
export function _verboseMsg(filePath: string, force: boolean) {
  const msg = `writing a file to the file-system at ${filePath}, force: ${force.toString()}`;
  return msg;
}
