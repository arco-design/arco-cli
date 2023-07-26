// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { DocsRootProps } from '@arco-cli/aspect/dist/docs/previewRuntime';

import { MDXLayout } from '../markdown/mdxLayout';
import { Theme } from './theme';
import { Content as DocContent } from './doc/content';
import { PropertiesTable } from './doc/propertiesTable';
import { DocAnchorContextProvider } from '../markdown/components/docAnchor';
import { PreviewContextProvider } from './previewContext';

import '../style/colors.scss';
import styles from './app.module.scss';

export function App({ doc, metadata }: DocsRootProps) {
  const isEmpty = !doc && (!metadata || (Array.isArray(metadata) && metadata.length === 0));

  return (
    <PreviewContextProvider>
      <Theme>
        <DocAnchorContextProvider>
          <MDXLayout>
            {isEmpty ? (
              <div className={styles.emptyWarning}>
                <div className={styles.title}>No valid component overview found.</div>
                <div className={styles.details}>
                  Please check your component [entries.preview] config in [arco.workspace.jsonc].
                </div>
              </div>
            ) : (
              <>
                <DocContent doc={doc} />
                <PropertiesTable doclet={metadata as any} />
              </>
            )}
          </MDXLayout>
        </DocAnchorContextProvider>
      </Theme>
    </PreviewContextProvider>
  );
}
