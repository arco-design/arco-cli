// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { CLASSNAME_MARKDOWN_CONTENT } from '../../constants';

import styles from './content.module.scss';

interface DocsContentProps {
  doc?: ComponentType;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className={styles.errorBoundary} role="alert">
      <p className={styles.title}>Failed to render. Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

export function Content({ doc }: DocsContentProps) {
  const Content: any = typeof doc === 'function' ? doc : () => null;
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={CLASSNAME_MARKDOWN_CONTENT}>
        <Content />
      </div>
    </ErrorBoundary>
  );
}
