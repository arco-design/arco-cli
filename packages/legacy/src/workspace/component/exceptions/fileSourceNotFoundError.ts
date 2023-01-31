import AbstractError from '../../../error/abstractError';

export class FileSourceNotFoundError extends AbstractError {
  path: string;

  constructor(path: string) {
    super();
    this.path = path;
  }
}
