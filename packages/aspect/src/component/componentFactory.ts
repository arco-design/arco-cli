import { AspectDefinition } from '@arco-cli/core/dist/aspect-loader';
import { Component } from './component';

export interface ComponentFactory {
  /**
   * name of the component host.
   */
  name: string;

  /**
   * path to the component host.
   */
  path: string;

  /**
   * returns a component by id.
   */
  get(id: string): Promise<Component | undefined>;

  /**
   * returns many components by ids.
   */
  getMany(ids: string[]): Promise<Component[]>;

  /**
   * get component-ids matching the given pattern. a pattern can have multiple patterns separated by a comma.
   * it uses multimatch (https://www.npmjs.com/package/multimatch) package for the matching algorithm, which supports
   * (among others) negate character "!" to exclude ids. See the package page for more supported characters.
   */
  getManyByPattern(pattern: string, throwForNoMatch?: boolean): Promise<Component[]>;

  /**
   * list all components in the host.
   */
  list(): Promise<Component[]>;

  /**
   * resolve dirs for aspects
   */
  resolveAspects: (runtimeName?: string) => Promise<AspectDefinition[]>;
}
