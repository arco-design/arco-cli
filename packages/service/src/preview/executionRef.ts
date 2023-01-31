import { Component } from '@arco-cli/aspect/dist/component';
import type { ExecutionContext } from '@arco-cli/aspect/dist/envs';

export class ExecutionRef {
  constructor(public executionCtx: ExecutionContext) {
    this.currentComponents = executionCtx.components;
  }

  currentComponents: Component[];

  add(added: Component) {
    this.currentComponents = this.currentComponents.concat(added);
  }

  remove(removed: string) {
    this.currentComponents = this.currentComponents.filter((c) => c.id !== removed);
  }

  update(next: Component) {
    this.currentComponents = this.currentComponents.map((c) => (c.id === next.id ? next : c));
  }

  get(id: string) {
    return this.currentComponents.find((x) => x.id === id);
  }
}
