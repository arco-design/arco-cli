// eslint-disable-next-line import/no-extraneous-dependencies
import React, { PropsWithChildren } from 'react';
import { CodeSnippet } from '../snippet/codeSnippet';

import styles from './demoView.module.scss';

export interface DemoViewProps {
  code?: string;
}

export function DemoView({ children, code }: PropsWithChildren<DemoViewProps>) {
  return (
    <div className={styles.demoView}>
      <div className={styles.demo}>{children}</div>
      {code ? <CodeSnippet className={styles.code}>{code}</CodeSnippet> : null}
    </div>
  );
}
