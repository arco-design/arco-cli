import Bluebird from 'bluebird';
import * as path from 'path';
import logger from '../../../logger/logger';
import AbstractVinyl from './abstractVinyl';
import RemovePath from './removePath';
import { concurrentIOLimit } from '../../../utils/concurrency';
import removeFilesAndEmptyDirsRecursively from '../../../utils/fs/removeFilesAndEmptyDirsRecursively';

export default class DataToPersist {
  files: AbstractVinyl[];

  remove: RemovePath[];

  constructor() {
    this.files = [];
    this.remove = [];
  }

  addFile(file: AbstractVinyl) {
    if (!file) throw new Error('failed adding an empty file into DataToPersist');
    if (!file.path) {
      throw new Error(
        'failed adding a file into DataToPersist as it does not have a path property'
      );
    }
    const existingFileIndex = this.files.findIndex(
      (existingFile) => existingFile.path === file.path
    );
    if (existingFileIndex !== -1) {
      if (file.override) {
        this.files.splice(existingFileIndex, 1);
      } else {
        // don't push this one. keep the existing file
        return;
      }
    }
    this.throwForDirectoryCollision(file);
    this.files.push(file);
  }

  addManyFiles(files: AbstractVinyl[] = []) {
    files.forEach((file) => this.addFile(file));
  }

  removePath(pathToRemove: RemovePath) {
    if (!pathToRemove) throw new Error('failed adding a path to remove into DataToPersist');
    if (!this.remove.includes(pathToRemove)) {
      this.remove.push(pathToRemove);
    }
  }

  removeManyPaths(pathsToRemove: RemovePath[] = []) {
    pathsToRemove.forEach((pathToRemove) => this.removePath(pathToRemove));
  }

  merge(dataToPersist: DataToPersist | null | undefined) {
    if (!dataToPersist) return;
    this.addManyFiles(dataToPersist.files);
    this.removeManyPaths(dataToPersist.remove);
  }

  async persistAllToFS() {
    this.log();
    this.validateAbsolute();
    // the order is super important. first remove, then create and finally symlink
    await this.deletePathsFromFS();
    await this.persistFilesToFS();
  }

  addBasePath(basePath: string) {
    this.files.forEach((file) => {
      this.assertRelative(file.base);
      file.updatePaths({ newBase: path.join(basePath, file.base) });
    });
    this.remove.forEach((removePath) => {
      this.assertRelative(removePath.path);
      removePath.path = path.join(basePath, removePath.path);
    });
  }

  /**
   * helps for debugging
   */
  toConsole() {
    console.log(`\nfiles: ${this.files.map((f) => f.path).join('\n')}`);
    console.log(`remove: ${this.remove.map((r) => r.path).join('\n')}`);
  }

  filterByPath(filterFunc: (p: string) => boolean): DataToPersist {
    const dataToPersist = new DataToPersist();
    dataToPersist.addManyFiles(this.files.filter((f) => filterFunc(f.path)));
    dataToPersist.removeManyPaths(this.remove.filter((r) => filterFunc(r.path)));
    return dataToPersist;
  }

  private async persistFilesToFS() {
    const concurrency = concurrentIOLimit();
    return Bluebird.map(this.files, (file) => file.write(), { concurrency });
  }

  private async deletePathsFromFS() {
    const pathWithRemoveItsDirIfEmptyEnabled = this.remove
      .filter((p) => p.removeItsDirIfEmpty)
      .map((p) => p.path);
    const restPaths = this.remove.filter((p) => !p.removeItsDirIfEmpty);
    if (pathWithRemoveItsDirIfEmptyEnabled.length) {
      await removeFilesAndEmptyDirsRecursively(pathWithRemoveItsDirIfEmptyEnabled);
    }
    const concurrency = concurrentIOLimit();
    return Bluebird.map(restPaths, (removePath) => removePath.persistToFS(), { concurrency });
  }

  private validateAbsolute() {
    // it's important to make sure that all paths are absolute before writing them to the
    // filesystem. relative paths won't work when running arco commands from an inner dir
    const validateAbsolutePath = (pathToValidate) => {
      if (!path.isAbsolute(pathToValidate)) {
        throw new Error(`DataToPersist expects ${pathToValidate} to be absolute, got relative`);
      }
    };
    this.files.forEach((file) => {
      validateAbsolutePath(file.path);
    });
    this.remove.forEach((removePath) => {
      validateAbsolutePath(removePath.path);
    });
  }

  private log() {
    if (this.remove.length) {
      const pathToDeleteStr = this.remove.map((r) => r.path).join('\n');
      logger.debug(`DataToPersist, paths-to-delete:\n${pathToDeleteStr}`);
    }
    if (this.files.length) {
      const filesToWriteStr = this.files.map((f) => f.path).join('\n');
      logger.debug(`DataToPersist, paths-to-write:\n${filesToWriteStr}`);
    }
  }

  private assertRelative(pathToCheck: string) {
    if (path.isAbsolute(pathToCheck)) {
      throw new Error(`DataToPersist expects ${pathToCheck} to be relative, but found it absolute`);
    }
  }

  /**
   * prevent adding a file which later on will cause an error "EEXIST: file already exists, mkdir {dirname}".
   * this happens one a file is a directory name of the other file.
   * e.g. adding these two files, will cause the error above: "bar/foo" and "bar"
   *
   * to check for this possibility, we need to consider two scenarios:
   * 1) "bar/foo" is there and now adding "bar" => check whether one of the files starts with "bar/"
   * 2) "bar" is there and now adding "bar/foo" => check whether this file "bar/foo" starts with one of the files with '/'
   * practically, it runs `("bar/foo".startsWith("bar/"))` for both cases above.
   */
  private throwForDirectoryCollision(file: AbstractVinyl) {
    const directoryCollision = this.files.find(
      (f) =>
        f.path.startsWith(`${file.path}${path.sep}`) ||
        `${file.path}`.startsWith(`${f.path}${path.sep}`)
    );
    if (directoryCollision) {
      throw new Error(`unable to add the file "${file.path}", because another file "${directoryCollision.path}" is going to be written.
one of them is a directory of the other one, and is not possible to have them both`);
    }
  }
}
