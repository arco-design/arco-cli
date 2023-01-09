import { ArcoBaseEvent } from '@arco-cli/pubsub/dist/preview';

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
