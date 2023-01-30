import ArcoError from '@arco-cli/legacy/dist/error/arcoError';

export class InvalidTaskError extends ArcoError {
  constructor(readonly taskAspectId: string, reason: string) {
    super(`task of ${taskAspectId} is invalid, ${reason}`);
  }
}
