import { Component } from '@arco-cli/component';

export class ArtifactStorageError extends Error {
  constructor(_: Error, component: Component) {
    super(`failed to store artifacts for component ${component.id}`);
  }
}
