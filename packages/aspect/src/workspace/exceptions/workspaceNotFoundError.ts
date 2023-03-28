import AbstractError from '@arco-cli/legacy/dist/error/abstractError';

export class WorkspaceNotFoundError extends AbstractError {
  message = `workspace not found, please run arco command in a arco workspace`;
}
