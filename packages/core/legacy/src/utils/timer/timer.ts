import { TimerAlreadyRunningError, TimerNotStartedError } from './exceptions';
import { TimerResponse } from './response';

export class Timer {
  private startTime: number | null = null;

  start(): Timer {
    if (this.startTime) throw new TimerAlreadyRunningError();
    this.startTime = Date.now();
    return this;
  }

  stop(): TimerResponse {
    if (!this.startTime) throw new TimerNotStartedError();
    const endTime = Date.now();
    return new TimerResponse(this.calculateElapsed(this.startTime, endTime));
  }

  private calculateElapsed(startTime: number, endTime: number) {
    return endTime - startTime;
  }

  static create() {
    return new Timer();
  }
}
