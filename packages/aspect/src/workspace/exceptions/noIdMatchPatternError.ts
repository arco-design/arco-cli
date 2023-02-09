
export class NoIdMatchPatternError extends Error {
  isUserError = true;

  constructor(pattern?: string) {
    super(`unable to find any matching for "${pattern}" pattern`);
    this.name = this.constructor.name;
  }
}
