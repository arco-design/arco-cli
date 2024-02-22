// eslint-disable-next-line import/no-extraneous-dependencies
import React, { Fragment, useEffect, useMemo } from 'react';
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
import { VALID_MESSAGE_TYPE_FROM_PARENT_WINDOW } from '../constants';
import { SlotRegister } from './SlotRegister';

import '../style/colors.scss';
import styles from './app.module.scss';

export function App({ doc, metadata, docContextProvider }: DocsRootProps) {
  const { doclets, apiPlaceholderElementId } = metadata || {};
  const isEmpty = !doc && (!doclets || (Array.isArray(doclets) && doclets.length === 0));
  const ContextProvider = typeof docContextProvider === 'function' ? docContextProvider : Fragment;

  const userEventListenerSlots = useMemo<
    Record<string, SlotRegister<(event: { type: string; data: any }) => void>>
  >(() => {
    const slots = {};

    Object.values(VALID_MESSAGE_TYPE_FROM_PARENT_WINDOW).forEach((type) => {
      slots[type] = new SlotRegister();
    });

    (window as any).__registerArcoPreviewEventListener = (
      event: VALID_MESSAGE_TYPE_FROM_PARENT_WINDOW,
      handler: () => void
    ) => {
      return slots[event]?.register(handler);
    };

    return slots;
  }, []);

  const { pubsub, pubsubTopic, pubsubTopicParent } = useMemo(() => {
    const pubsub = new Pubsub();
    const pubsubTopic = 'preview';
    const pubsubTopicParent = 'preview-host';

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

    return { pubsub, pubsubTopic, pubsubTopicParent };
  }, []);

  useEffect(() => {
    pubsub?.sub(pubsubTopicParent, (message) => {
      const { type, data } = message;
      switch (type) {
        case VALID_MESSAGE_TYPE_FROM_PARENT_WINDOW.switchDarkMode: {
          const body = document.body;
          data.dark ? body.setAttribute('arco-theme', 'dark') : body.removeAttribute('arco-theme');
          break;
        }
        case VALID_MESSAGE_TYPE_FROM_PARENT_WINDOW.appendExtraStyle: {
          const eleClassName = '__arco-component-extra-style';
          // clear all append styles at first
          document
            .querySelectorAll(`.${eleClassName}`)
            .forEach((node) => document.body.removeChild(node));
          // insert new stylesheet
          if (data.href) {
            const styleEle = document.createElement('link');
            styleEle.setAttribute('class', eleClassName);
            styleEle.setAttribute('type', 'text/css');
            styleEle.setAttribute('rel', 'stylesheet');
            styleEle.setAttribute('href', data.href);
            document.body?.prepend(styleEle);
          }
          break;
        }
        case VALID_MESSAGE_TYPE_FROM_PARENT_WINDOW.scrollIntoView: {
          const { selector, options } = data;
          if (selector) {
            document.body.querySelector(selector)?.scrollIntoView(options);
          }
          break;
        }
        default:
          break;
      }

      if (Object.values(VALID_MESSAGE_TYPE_FROM_PARENT_WINDOW).indexOf(type as any) > -1) {
        userEventListenerSlots[type]?.values().forEach((callback) => {
          callback(message);
        });
      }
    });
  }, [pubsub]);

  return (
    <PreviewContextProvider
      pubsub={pubsub}
      pubsubTopic={pubsubTopic}
      pubsubTopicParent={pubsubTopicParent}
    >
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
            <ContextProvider>
              <DocContent doc={doc} />
              <PropertiesTable doclet={doclets as any} placeholderID={apiPlaceholderElementId} />
              <DocAnchor />
            </ContextProvider>
          )}
        </MDXLayout>
      </Theme>
    </PreviewContextProvider>
  );
}
