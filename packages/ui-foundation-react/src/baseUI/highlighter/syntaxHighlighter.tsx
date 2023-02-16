// eslint-disable-next-line import/no-extraneous-dependencies
import React, { memo } from 'react';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import PrismHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import tsxSyntax from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import defaultTheme from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';

PrismHighlighter.registerLanguage('tsx', tsxSyntax);

export const SyntaxHighlighter = memo((props: SyntaxHighlighterProps) => {
  return <PrismHighlighter style={defaultTheme} {...props} />;
});

export { SyntaxHighlighterProps };
