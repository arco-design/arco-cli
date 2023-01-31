import { Component } from '@aspect/component';

export type SerializableResults = { results: any; toString: () => string };

export type OnComponentEventResult = { extensionId: string; results: SerializableResults };

export type OnComponentLoad = (component: Component) => Promise<Record<string, any> | undefined>;

export type OnComponentAdd = (
  component: Component,
  files: string[]
) => Promise<SerializableResults>;

export type OnComponentChange = (
  component: Component,
  files: string[]
) => Promise<SerializableResults>;

export type OnComponentRemove = (componentId: string) => Promise<SerializableResults>;
