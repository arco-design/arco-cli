export default class ArcoError extends Error {
  isUserError = true;

  constructor(msg?: string) {
    super(msg || '');
    this.name = this.constructor.name; // otherwise, the "name" is just Error.
  }

  /**
   * override if you want your error to be pretty (e.g. with color with chalk).
   * eventually, the error shown to the user is the output of this method
   */
  report(): string {
    return this.message;
  }
}
