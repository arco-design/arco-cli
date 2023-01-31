import { RuntimeDefinition } from './runtimeDefinition';
import { ProviderFn } from '../types';
import { Aspect } from '../aspect';
import { SlotProvider } from '../slot';

export interface RuntimeManifest {
  runtime: RuntimeDefinition | string;
  provider: ProviderFn;
  dependencies?: Aspect[];
  slots?: SlotProvider<unknown>[];
  defaultConfig?: Record<string, any>;
}
