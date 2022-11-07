import chalk from 'chalk';
import ArcoError from '../../../../error/arcoError';

export class IgnoredDirectoryError extends ArcoError {
  constructor(dir: string) {
    super(chalk.yellow(`directory "${dir}" or its files are git-ignored`));
  }
}
