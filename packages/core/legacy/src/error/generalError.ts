import AbstractError from './abstractError';

export default class GeneralError extends AbstractError {
  msg: string;

  constructor(msg: string) {
    super();
    this.msg = msg;
  }
}
