import { ArcoBaseEvent } from './arcoBaseEvent';

export type LocationHashEventType = {
  hash: string;
};

export class LocationHashEvent extends ArcoBaseEvent<LocationHashEventType> {
  static readonly TYPE = 'preview-location-hash';

  constructor(event: LocationHashEventType) {
    super(LocationHashEvent.TYPE, '0.0.1', new Date().getTime(), event);
  }
}
