// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo, useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import copy from 'copy-to-clipboard';

import { SyntaxHighlighter, SyntaxHighlighterProps } from '../../../baseUI/highlighter';

import styles from './codeSnippet.module.scss';
import IconCopy from '../asset/icon-copy.svg';
import IconCheck from '../asset/icon-check.svg';
import IconShrink from '../asset/icon-shrink.svg';
import IconExpand from '../asset/icon-expand.svg';

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
} & SyntaxHighlighterProps;

/**
 * A code snippet component
 */
export function CodeSnippet({
  className,
  frameClass,
  language = 'tsx',
  children,
  ...rest
}: CodeSnippetProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeExpanded, setCodeExpanded] = useState(false);

  const refResetCopyStatusTimer = useRef<any>(null);
  const trimmedChildren = useMemo(() => children.trim(), [children]);

  useEffect(() => {
    clearTimeout(refResetCopyStatusTimer.current);
    refResetCopyStatusTimer.current = setTimeout(() => {
      setCodeCopied(false);
    }, 1000);
  }, [codeCopied]);

  useEffect(() => {
    return () => {
      clearTimeout(refResetCopyStatusTimer.current);
    };
  }, []);

  return (
    <div className={classNames(styles.snippetWrapper, className)}>
      <SyntaxHighlighter
        {...rest}
        className={classNames(styles.codeSnippet, frameClass, { [styles.expanded]: codeExpanded })}
        language={language}
        customStyle={customStyles}
      >
        {trimmedChildren}
      </SyntaxHighlighter>

      <div className={styles.operationButtons}>
        <button
          onClick={() => {
            const result = copy(children.toString());
            setCodeCopied(result);
          }}
        >
          {codeCopied ? <IconCheck /> : <IconCopy />}
        </button>
        <button onClick={() => setCodeExpanded(!codeExpanded)}>
          {codeExpanded ? <IconShrink /> : <IconExpand />}
        </button>
      </div>
    </div>
  );
}
