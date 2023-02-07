import { ArcoBaseEvent } from '@arco-cli/aspect/dist/pubsub/previewRuntime';

export type SizeEventType = {
  height: number;
  width: number;
};

export class SizeEvent extends ArcoBaseEvent<SizeEventType> {
  static readonly TYPE = 'preview-size';

  constructor(sizeEvent: SizeEventType) {
    super(SizeEvent.TYPE, '0.0.1', new Date().getTime(), sizeEvent);
  }
}
