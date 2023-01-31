import type { Stats } from 'webpack';
import { ArcoBaseEvent } from '@arco-cli/core/dist/pubsub';

class WebpackCompilationDoneEventData {
  constructor(readonly stats: Stats, readonly devServerID: string) {}
}

export class WebpackCompilationDoneEvent extends ArcoBaseEvent<WebpackCompilationDoneEventData> {
  static readonly TYPE = 'webpack-compilation-done';

  constructor(readonly timestamp: number, readonly stats: Stats, readonly devServerID: string) {
    super(
      WebpackCompilationDoneEvent.TYPE,
      '0.0.1',
      timestamp,
      new WebpackCompilationDoneEventData(stats, devServerID)
    );
  }
}
