// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { CodeSnippet } from './codeSnippet';

export type SnippetProps = {
  children: string;
  live?: boolean | string;
};

export function Snippet({ children, live }: SnippetProps) {
  // TODO live code snippet
  if (live) {
    return null;
  }

  return <CodeSnippet>{children}</CodeSnippet>;
}
