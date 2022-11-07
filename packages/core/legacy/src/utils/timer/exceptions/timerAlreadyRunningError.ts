export class TimerAlreadyRunningError extends Error {
  constructor() {
    super('timer already running');
  }
}
