export class PubsubNoParentError extends Error {
  constructor() {
    super('could not connect to parent window');
    this.name = 'PubsubNoParentError';
  }
}
