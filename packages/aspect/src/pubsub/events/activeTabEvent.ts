import { ArcoBaseEvent } from './arcoBaseEvent';

export type ActiveTabEventType = {
  activeTab: string;
};

export class ActiveTabEvent extends ArcoBaseEvent<ActiveTabEventType> {
  static readonly TYPE = 'preview-active-tab';

  constructor(event: ActiveTabEventType) {
    super(ActiveTabEvent.TYPE, '0.0.1', new Date().getTime(), event);
  }
}
