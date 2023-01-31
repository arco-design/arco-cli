import chalk from 'chalk';
import ArcoError from '../../../error/arcoError';

export class ComponentNotFoundInPathError extends ArcoError {
  path: string;

  code: number;

  constructor(path: string) {
    super(`error: component in path "${chalk.bold(path)}" was not found`);
    this.code = 127;
    this.path = path;
  }
}
