export class InvalidNameError extends Error {
  componentName: string;

  constructor(componentName: string) {
    super(
      `error: "${componentName}" is invalid, component names can only contain alphanumeric, lowercase characters, and the following ["-", "_", "$", "!", "/"]`
    );
  }
}
