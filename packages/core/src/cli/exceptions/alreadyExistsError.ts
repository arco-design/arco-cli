import ArcoError from '@arco-cli/legacy/dist/error/arcoError';

export class AlreadyExistsError extends ArcoError {
  constructor(type: string, name: string) {
    super(`${type} ${name} already exists.`);
  }
}
