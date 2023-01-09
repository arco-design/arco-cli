/**
 * Please Notice: This file will run in the preview iframe.
 */

import { PreviewRuntime } from '@arco-cli/preview/dist/preview';

import { EventEmitter2 } from 'eventemitter2';
import { connectToParent, ErrorCode } from 'penpal';

import { ArcoBaseEvent } from '../arcoBaseEvent';
import { PubsubNoParentError } from '../exceptions';
import { PubsubAspect } from '../pubsub.aspect';

type Callback = (event: ArcoBaseEvent<any>) => void;

type ParentMethods = {
  pub: (topic: string, event: ArcoBaseEvent<any>) => Promise<any>;
};

export class PubsubPreview {
  static runtime = PreviewRuntime;

  static async provider(): Promise<PubsubPreview> {
    const pubsubPreview = new PubsubPreview();

    if (pubsubPreview.inIframe()) {
      pubsubPreview.connectToParentPubSub().catch((err) => {
        // parent window is not required to accept connections
        if (err instanceof PubsubNoParentError) return;
        console.error('[Pubsub.preview]', err);
      });
    }

    return pubsubPreview;
  }

  private parentPubsub?: ParentMethods;

  private events = new EventEmitter2();

  private inIframe() {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch (e: any) {
      return false;
    }
  }

  private connectToParentPubSub = (retries = 10): Promise<ParentMethods | undefined> => {
    if (retries <= 0) throw new PubsubNoParentError();

    return connectToParent<ParentMethods>({
      timeout: 300,
      methods: {
        pub: this.handleMessageFromParent,
      },
    })
      .promise.then((parentPubsub) => {
        this.parentPubsub = parentPubsub;
        return parentPubsub;
      })
      .catch((e: any) => {
        if (e.code !== ErrorCode.ConnectionTimeout) throw e;
        return this.connectToParentPubSub(retries - 1);
      });
  };

  private handleMessageFromParent = (topic: string, message: ArcoBaseEvent<any>) => {
    this.events.emit(topic, message);
  };

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
}

PubsubAspect.addRuntime(PubsubPreview);
