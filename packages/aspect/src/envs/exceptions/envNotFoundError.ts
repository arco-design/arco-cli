import ArcoError from '@arco-cli/legacy/dist/error/arcoError';

export class EnvNotFoundError extends ArcoError {
  constructor(id: string) {
    super(`environment with ID: ${id} was not found`);
  }
}
