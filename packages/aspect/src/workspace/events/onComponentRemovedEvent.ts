import { ArcoBaseEvent } from '@aspect/pubsub';

class OnComponentRemovedEventData {
  constructor(readonly idStr) {}
}

export class OnComponentRemovedEvent extends ArcoBaseEvent<OnComponentRemovedEventData> {
  static readonly TYPE = 'on-component-removed';

  constructor(readonly timestamp, readonly idStr) {
    super(OnComponentRemovedEvent.TYPE, '0.0.1', timestamp, new OnComponentRemovedEventData(idStr));
  }
}
