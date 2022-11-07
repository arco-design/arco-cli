import { Aspect } from './aspect';
import { SlotProvider } from '../slot';
import { RuntimeDefinition } from '../runtimes';

export type AspectManifest = {
  id: string;
  dependencies?: Aspect[];
  slots?: SlotProvider<unknown>[];
  defaultConfig?: Record<string, any>;
  declareRuntime?: RuntimeDefinition;
  files?: string[];
};
