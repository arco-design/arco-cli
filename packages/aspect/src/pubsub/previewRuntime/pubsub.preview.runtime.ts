/**
 * Please Notice: This file will run in the preview iframe.
 */

import { PreviewRuntime } from '@arco-cli/service/dist/preview/previewRuntime';

import { Pubsub } from './pubsub';
import { PubsubAspect } from '../pubsub.aspect';

export class PubsubPreview extends Pubsub {
  static runtime = PreviewRuntime;

  static async provider(): Promise<PubsubPreview> {
    return new PubsubPreview();
  }
}

PubsubAspect.addRuntime(PubsubPreview);
