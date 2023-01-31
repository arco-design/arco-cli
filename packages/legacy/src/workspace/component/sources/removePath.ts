import fs from 'fs-extra';
import removeFilesAndEmptyDirsRecursively from '../../../utils/fs/removeFilesAndEmptyDirsRecursively';

export default class RemovePath {
  path: string;

  removeItsDirIfEmpty: boolean;

  constructor(path: string, removeItsDirIfEmpty = false) {
    this.path = path;
    this.removeItsDirIfEmpty = removeItsDirIfEmpty;
  }

  async persistToFS() {
    if (this.removeItsDirIfEmpty) {
      return removeFilesAndEmptyDirsRecursively([this.path]);
    }
    return fs.remove(this.path);
  }
}
