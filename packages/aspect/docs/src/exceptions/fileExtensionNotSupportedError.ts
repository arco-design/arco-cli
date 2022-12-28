export class FileExtensionNotSupportedError extends Error {
  constructor(filePath: string, extension: string) {
    super(
      `failed reading doc file: ${filePath} as file extension ${extension} is not supported by any of registered component doc readers.`
    );
  }
}
