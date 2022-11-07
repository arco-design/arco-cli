export default class AbstractError extends Error {
  isUserError: boolean;

  constructor() {
    super();
    this.name = this.constructor.name;
    this.isUserError = true;
  }
}
