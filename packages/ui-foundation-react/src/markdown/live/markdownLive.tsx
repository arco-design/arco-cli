// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode } from 'react';
import gfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import cs from 'classnames';

import { Heading } from '../components/heading';
import { CodeSnippet } from '../components/snippet/codeSnippet';

import styles from './markdownLive.module.scss';

const MARKDOWN_BODY_CLASSNAME = 'markdown-body';

export interface MarkdownLiveProps {
  className?: string;
  children?: string;
}

function H1(props) {
  return <Heading depth={1} {...props} />;
}
function H2(props) {
  return <Heading depth={2} {...props} />;
}
function H3(props) {
  return <Heading depth={3} {...props} />;
}
function H4(props) {
  return <Heading depth={4} {...props} />;
}
function H5(props) {
  return <Heading depth={5} {...props} />;
}
function H6(props) {
  return <Heading depth={6} {...props} />;
}
function Code(props: { children: ReactNode; inline?: boolean }) {
  const { inline, children } = props;
  const code = children?.[0] || '';
  return inline ? <code>{code}</code> : <CodeSnippet children={code} />;
}

export function MarkdownLive(props: MarkdownLiveProps) {
  const { children, className } = props;

  return (
    <ReactMarkdown
      children={children}
      className={cs(MARKDOWN_BODY_CLASSNAME, styles.markdownLive, className)}
      remarkPlugins={[gfm]}
      components={{
        code: Code,
        h1: H1,
        h2: H2,
        h3: H3,
        h4: H4,
        h5: H5,
        h6: H6,
      }}
    />
  );
}
