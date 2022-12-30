import ArcoError from '@arco-cli/legacy/dist/error/ArcoError';

export class PreviewOutputFileNotFoundError extends ArcoError {
  constructor(componentId: string, filePath: string) {
    super(`preview output file for component: "${componentId}" was not found in the path: "${filePath}".

This is usually a result of an error during the bundling process.
The error might be an error of another component that uses the same env.`);
  }
}
