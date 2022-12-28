import { Component } from '@arco-cli/component';

export type SerializableResults = { results: any; toString: () => string };

export type OnComponentRemove = (componentId: string) => Promise<SerializableResults>;

export type OnComponentEventResult = { extensionId: string; results: SerializableResults };

export type OnMultipleComponentsAdd = () => Promise<void>;

export type OnComponentLoad = (component: Component) => Promise<Record<string, any> | undefined>;
