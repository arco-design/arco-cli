// eslint-disable-next-line import/no-extraneous-dependencies
import { ReactElement, ComponentType } from 'react';

export type Example = {
  title?: string;
  description?: ReactElement;
  scope?: { [key: string]: any };
  jsx?: ReactElement;
  code: string;
};

export type Docs = {
  /**
   * default is the docs content.
   */
  default: ComponentType;

  /**
   * component abstract.
   */
  abstract: string;

  /**
   * array of labels.
   */
  labels: string[];
};

export const defaultDocs: Docs = {
  default: () => null,
  labels: [],
  abstract: '',
};
