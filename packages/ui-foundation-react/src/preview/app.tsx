// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo } from 'react';
// import debounce from lodash-es/debounce to enable tree-shaking
import debounce from 'lodash-es/debounce';
import type { DocsRootProps } from '@arco-cli/aspect/dist/docs/previewRuntime';
import { Pubsub } from '@arco-cli/aspect/dist/pubsub/previewRuntime';

import { MDXLayout } from '../markdown/mdxLayout';
import { Theme } from './theme';
import { Content as DocContent } from './doc/content';
import { PropertiesTable } from './doc/propertiesTable';
import { DocAnchor } from '../markdown/components/docAnchor';
import { PreviewContextProvider } from './previewContext';

import '../style/colors.scss';
import styles from './app.module.scss';

export function App({ doc, metadata }: DocsRootProps) {
  const { doclets, apiPlaceholderElementId } = metadata || {};
  const isEmpty = !doc && (!doclets || (Array.isArray(doclets) && doclets.length === 0));

  const { pubsub, pubsubTopic } = useMemo(() => {
    const pubsub = new Pubsub();
    const pubsubTopic = 'preview';

    try {
      // in iframe
      if (typeof window !== 'undefined' && window.self !== window.top) {
        new ResizeObserver(
          debounce(() => {
            pubsub.reportSize(pubsubTopic, {
              width: window.document.body.offsetWidth,
              height: window.document.body.offsetHeight,
            });
          }, 300)
        ).observe(document.body);

        window.addEventListener('hashchange', () => {
          pubsub.reportLocationHash(pubsubTopic, { hash: window.location.hash });
        });
      }
    } catch (err) {}

    return { pubsub, pubsubTopic };
  }, []);

  return (
    <PreviewContextProvider pubsub={pubsub} pubsubTopic={pubsubTopic}>
      <Theme>
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
              <PropertiesTable doclet={doclets as any} placeholderID={apiPlaceholderElementId} />
              <DocAnchor />
            </>
          )}
        </MDXLayout>
      </Theme>
    </PreviewContextProvider>
  );
}
