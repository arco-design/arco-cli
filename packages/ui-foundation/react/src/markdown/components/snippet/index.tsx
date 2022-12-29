// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { CodeSnippet } from './codeSnippet';

import styles from './snippet.module.scss';

export type SnippetProps = {
  children: string;
  live?: boolean | string;
};

export function Snippet({ children, live }: SnippetProps) {
  // TODO live code snippet
  if (live) {
    return null;
  }

  return <CodeSnippet className={styles.snippet}>{children}</CodeSnippet>;
}
