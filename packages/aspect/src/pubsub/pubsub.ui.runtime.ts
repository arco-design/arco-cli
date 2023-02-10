import { EventEmitter2 } from 'eventemitter2';
import { connectToChild } from 'penpal';
import type { AsyncMethodReturns } from 'penpal/lib/types';
import { UIRuntime } from '@arco-cli/service/dist/ui/ui.aspect';

import { ArcoBaseEvent } from './events';
import { PubsubAspect } from './pubsub.aspect';
import { createProvider } from './pubsubContext';

type Callback = (event: ArcoBaseEvent<any>) => void;

type PubOptions = {
  /** forward the event to adjacent windows (including the preview iframe)  */
  propagate?: boolean;
};

type ChildMethods = {
  pub: (topic: string, event: ArcoBaseEvent<any>) => any;
};

export class PubsubUI {
  static runtime = UIRuntime;

  static dependencies = [];

  static async provider() {
    const pubsubUI = new PubsubUI();
    return pubsubUI;
  }

  constructor() {}

  private childApi?: AsyncMethodReturns<ChildMethods>;

  private events = new EventEmitter2();

  /**
   * publish event to all subscribers in this window
   */
  private emitEvent = (topic: string, event: ArcoBaseEvent<any>) => {
    this.events.emit(topic, event);
  };

  /**
   * publish event to nested iframes
   */
  private pubToChild = (topic: string, event: ArcoBaseEvent<any>) => {
    return this.childApi?.pub(topic, event);
  };

  private connectToIframe = (iframe: HTMLIFrameElement) => {
    const connection = connectToChild<ChildMethods>({
      iframe,
      methods: {
        pub: this.emitEvent,
      },
    });

    connection.promise
      .then((childConnection) => {
        this.childApi = childConnection;
      })
      .catch((err) => {
        console.error('[Pubsub.ui]', 'failed connecting to child iframe:', err);
      });

    const destroy = () => {
      connection && connection.destroy();
    };
    return destroy;
  };

  sub = (topic: string, callback: Callback) => {
    const events = this.events;
    events.on(topic, callback);

    const unSub = () => {
      events.off(topic, callback);
    };

    return unSub;
  };

  /**
   * publish event to all subscribers, including nested iframes.
   */
  pub = (topic: string, event: ArcoBaseEvent<any>, { propagate }: PubOptions = {}) => {
    this.emitEvent(topic, event);

    // opt-in to forward to iframe, as we would not want 'private' messages automatically passing to iframe
    if (propagate) {
      this.pubToChild(topic, event);
    }
  };

  getPubsubContext() {
    return createProvider({
      connect: this.connectToIframe,
    });
  }
}

PubsubAspect.addRuntime(PubsubUI);
