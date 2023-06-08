// eslint-disable-next-line import/no-extraneous-dependencies
import React, { PropsWithChildren } from 'react';
import { CodeSnippet } from '../snippet/codeSnippet';

import styles from './demoView.module.scss';

export interface DemoViewProps {
  language?: string;
  code?: string | { needDecode: boolean; value: string };
}

function decodeRawCode(uint8ArrayStr) {
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(uint8ArrayStr.split(',')));
}

export function DemoView({ children, code, language }: PropsWithChildren<DemoViewProps>) {
  const codeText = code ? (typeof code === 'string' ? code : code.value) : null;
  const needDecodeCodeText = code && typeof code === 'object' ? code.needDecode : false;

  return (
    <div className={styles.demoView}>
      <div className={styles.demo}>{children}</div>
      {codeText ? (
        <CodeSnippet className={styles.code} language={language} codeSandbox>
          {needDecodeCodeText ? decodeRawCode(codeText) : codeText}
        </CodeSnippet>
      ) : null}
    </div>
  );
}
