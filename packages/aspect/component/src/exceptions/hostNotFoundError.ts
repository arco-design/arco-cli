export class HostNotFoundError extends Error {
  constructor(private hostName: string) {
    super();
  }

  toString() {
    return `[component] error: host '${this.hostName}' was not found`;
  }
}
