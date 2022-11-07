export class TimerNotStartedError extends Error {
  constructor() {
    super('timer not started');
  }
}
