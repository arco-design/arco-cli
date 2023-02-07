import { ArcoBaseEvent } from '@arco-cli/aspect/dist/pubsub';

class CompilerErrorEventData {
  constructor(readonly error: any) {}
}

export class CompilerErrorEvent extends ArcoBaseEvent<CompilerErrorEventData> {
  static readonly TYPE = 'compiler-error';

  constructor(readonly error, readonly timestamp = Date.now()) {
    super(CompilerErrorEvent.TYPE, '0.0.1', timestamp, new CompilerErrorEventData(error));
  }
}
