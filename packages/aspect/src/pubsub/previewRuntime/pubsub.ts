// import debounce from lodash-es/debounce to enable tree-shaking
import debounce from 'lodash-es/debounce';
import { EventEmitter2 } from 'eventemitter2';
import { connectToParent, ErrorCode } from 'penpal';

import { PubsubNoParentError } from '../exceptions';
import { ArcoBaseEvent, SizeEvent } from '../events';

type Callback = (event: ArcoBaseEvent<any>) => void;

type ParentMethods = {
  pub: (topic: string, event: ArcoBaseEvent<any>) => Promise<any>;
};

export class Pubsub {
  private events = new EventEmitter2();

  private parentPubsub?: ParentMethods;

  private resizeObserver: ResizeObserver;

  constructor() {
    if (this.inIframe()) {
      this.connectToParentPubSub().catch((err) => {
        // parent window is not required to accept connections
        if (err instanceof PubsubNoParentError) return;
        console.error('[Pubsub]', err);
      });
    }
  }

  private inIframe() {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch (e) {
      return false;
    }
  }

  private handleMessageFromParent = (topic: string, message: ArcoBaseEvent<any>) => {
    this.events.emit(topic, message);
  };

  private async connectToParentPubSub(retries = 10): Promise<ParentMethods | undefined> {
    if (retries <= 0) throw new PubsubNoParentError();

    try {
      this.parentPubsub = await connectToParent<ParentMethods>({
        timeout: 300,
        methods: {
          pub: this.handleMessageFromParent,
        },
      }).promise;

      return this.parentPubsub;
    } catch (e) {
      if (e.code !== ErrorCode.ConnectionTimeout) throw e;
      return this.connectToParentPubSub(retries - 1);
    }
  }

  sub(topic: string, callback: Callback) {
    const emitter = this.events;
    emitter.on(topic, callback);

    const unSub = () => {
      emitter.off(topic, callback);
    };
    return unSub;
  }

  pub(topic: string, event: ArcoBaseEvent<any>) {
    this.events.emit(topic, event);
    this.parentPubsub?.pub(topic, event).catch((err) => {
      console.error('[Pubsub.preview]', err);
    });
  }

  reportSize(topic: string) {
    if (!this.inIframe()) return;

    this.resizeObserver ||= new ResizeObserver(
      debounce(() => {
        this.pub(
          topic,
          new SizeEvent({
            width: window.document.body.offsetWidth,
            height: window.document.body.offsetHeight,
          })
        );
      }, 300)
    );

    this.resizeObserver.observe(document.body);
  }
}
