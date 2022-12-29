// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo, memo } from 'react';
import classNames from 'classnames';
import copy from 'copy-to-clipboard';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import tsxSyntax from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import defaultTheme from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';

import styles from './codeSnippet.module.scss';

SyntaxHighlighter.registerLanguage('tsx', tsxSyntax);

const customStyles = { fontSize: 12 };

export type CodeSnippetProps = {
  /**
   * the code string to show and to be copied to clipboard
   */
  children: string;
  /**
   * a class to override the highlighter class
   */
  frameClass?: string;
  /**
   * the theme to be used in the highlighter
   */
  theme?: any;
} & SyntaxHighlighterProps;

const Highlighter = memo(function SnippetWrapper(props: SyntaxHighlighterProps) {
  return <SyntaxHighlighter {...props} />;
});

/**
 * A code snippet component
 */
export function CodeSnippet({
  className,
  frameClass,
  theme = defaultTheme,
  language = 'tsx',
  children,
  ...rest
}: CodeSnippetProps) {
  const handleClick = () => {
    copy(children.toString());
  };

  const trimmedChildren = useMemo(() => children.trim(), [children]);

  return (
    <div className={classNames(styles.snippetWrapper, className)}>
      <Highlighter
        {...rest}
        className={classNames(styles.codeSnippet, frameClass)}
        language={language}
        style={theme}
        customStyle={customStyles}
      >
        {trimmedChildren}
      </Highlighter>

      <div className={styles.copy}>
        <img
          src="https://static.bit.cloud/Community/icons/copy.svg"
          onClick={handleClick}
          className={styles.copyIcon}
          alt="Copy"
        />
      </div>
    </div>
  );
}
