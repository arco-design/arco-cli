/* eslint-disable max-classes-per-file */
import { ArcoBaseEvent } from '@arco-cli/pubsub';
import { Component } from '@arco-cli/component';
import { CompileError } from '../types';

class ComponentCompilationOnDoneEventData {
  constructor(
    readonly errors: Array<CompileError>,
    readonly component: Component,
    readonly buildResults: string[]
  ) {}
}

export class ComponentCompilationOnDoneEvent extends ArcoBaseEvent<ComponentCompilationOnDoneEventData> {
  static readonly TYPE = 'component-compilation-on-done';

  constructor(
    readonly errors: Array<CompileError>,
    readonly component: Component,
    readonly buildResults: string[],
    readonly timestamp = Date.now()
  ) {
    super(
      ComponentCompilationOnDoneEvent.TYPE,
      '0.0.1',
      timestamp,
      new ComponentCompilationOnDoneEventData(errors, component, buildResults)
    );
  }
}
