import { Aspect } from '@arco-cli/stone';

import { MainRuntime } from '@core/cli';

import { AspectLoaderAspect } from './aspectLoader.aspect';
import { AspectDefinition, AspectDefinitionProps } from './aspectDefinition';

export class AspectLoaderMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static provider() {
    return new AspectLoaderMain();
  }

  constructor() {}

  private _reserved = ['arco.app/arco'];

  private _coreAspects: Aspect[];

  get coreAspects() {
    return this._coreAspects;
  }

  setCoreAspects(aspects: Aspect[]) {
    this._coreAspects = aspects;
    return this;
  }

  getCoreAspectIds() {
    const ids = this.coreAspects.map((aspect) => aspect.id);
    return ids.concat(this._reserved);
  }

  loadDefinition(props: AspectDefinitionProps): AspectDefinition {
    return AspectDefinition.from(props);
  }
}

AspectLoaderAspect.addRuntime(AspectLoaderMain);
