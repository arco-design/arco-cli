export class RuntimeNotDefinedError extends Error {
  constructor(name: string) {
    super(`runtime: '${name}' was not defined by any aspect`);
  }
}
