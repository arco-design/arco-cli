import cs from 'classnames';
import debounce from 'lodash-es/debounce';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Spin } from '@arco-design/web-react';
import { IconFullscreen, IconFullscreenExit, IconShareInternal } from '@arco-design/web-react/icon';

import { OverviewProps, OverviewHandle } from './interface';
import { useConnectIframe } from '../utils/useConnectIframe';
import { findNode } from '../utils/findNode';
import { on, off } from '../utils/dom';

// @ts-ignore
import styles from './style/index.module.less';
import {
  PREVIEW_IFRAME_GLOBAL_VARIABLES_KEY,
  PUBSUB_TOPIC_PARENT_TO_CHILD,
} from '../utils/constant';

const enum IFRAME_VALID_MESSAGE_TYPE {
  updateAnchorOffset = 'updateAnchorOffset',
  appendExtraStyle = 'appendExtraStyle',
  switchDarkMode = 'switchDarkMode',
  scrollIntoView = 'scrollIntoView',
  switchActiveTab = 'switchActiveTab',
}

function getContainer(targetContainer?: string | HTMLElement | Window) {
  if (typeof targetContainer === 'string') {
    return findNode(document, targetContainer);
  }
  return targetContainer || window;
}

function canAccessIFrame(iframe: HTMLIFrameElement) {
  let html = null;
  try {
    // deal with older browsers
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    html = doc.body.innerHTML;
  } catch (err) {}

  return html !== null;
}

export const Overview = forwardRef(function (props: OverviewProps, ref) {
  const {
    style,
    className,
    src,
    iframe,
    extraStyle,
    darkMode,
    scrollContainer,
    scrollContainerOffset = 0,
    timeout = 15000,
    spinProps,
    onReady,
    onTimeout,
    onIframeLoad,
    onIframeError,
    onIframeLocationHashChange,
    onIframeActiveTabChange,
  } = props;

  const refIframe = useRef<HTMLIFrameElement>(null);
  const refScrollContainer = useRef<HTMLElement | Window>(null);
  const refLoadingTimer = useRef<any>(null);

  const [iframeLoadTimes, setIframeLoadTimes] = useState(0);
  const [iframeFullscreen, setIframeFullscreen] = useState(false);

  const { height, locationHash, activeTab, connection } = useConnectIframe(refIframe);
  const isLoading = !height;

  useEffect(() => {
    if (!isLoading) {
      onReady?.();
      clearTimeout(refLoadingTimer.current);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      onIframeLocationHashChange?.(locationHash);
    }
  }, [locationHash]);

  useEffect(() => {
    if (!isLoading) {
      onIframeActiveTabChange?.(activeTab);
    }
  }, [activeTab]);

  const operateIframe = useCallback(
    ({ type, data }: { type: IFRAME_VALID_MESSAGE_TYPE; data: Record<string, any> }) => {
      if (!refIframe.current) return;

      const contentWindow = canAccessIFrame(refIframe.current)
        ? refIframe.current.contentWindow
        : null;

      // compatible with preview logic before 2.1.0, directly operate iframe DOM nodes
      if (
        contentWindow &&
        !(contentWindow as any)[PREVIEW_IFRAME_GLOBAL_VARIABLES_KEY]?.parentMessageIsSubscribed
      ) {
        switch (type) {
          case IFRAME_VALID_MESSAGE_TYPE.updateAnchorOffset: {
            const updateAnchorOffset = (contentWindow as any).__arcoPreviewMethods
              ?.updateAnchorOffset;
            if (typeof updateAnchorOffset === 'function') {
              try {
                updateAnchorOffset(data.offset);
              } catch (err) {
                console.warn(`Failed to update anchor position in component preview page, details:
${err.toString()}`);
              }
            }
            break;
          }

          case IFRAME_VALID_MESSAGE_TYPE.appendExtraStyle: {
            const eleClassName = '__arco-component-extra-style';
            // clear all append styles at first
            contentWindow.document
              .querySelectorAll(`.${eleClassName}`)
              .forEach((node) => contentWindow.document.body.removeChild(node));
            if (data.href) {
              const styleEle = document.createElement('link');
              styleEle.setAttribute('class', eleClassName);
              styleEle.setAttribute('type', 'text/css');
              styleEle.setAttribute('rel', 'stylesheet');
              styleEle.setAttribute('href', data.href);
              contentWindow.document.body?.prepend(styleEle);
            }
            break;
          }

          case IFRAME_VALID_MESSAGE_TYPE.switchDarkMode: {
            const body = contentWindow.document.body;
            data.dark
              ? body.setAttribute('arco-theme', 'dark')
              : body.removeAttribute('arco-theme');
            break;
          }

          case IFRAME_VALID_MESSAGE_TYPE.scrollIntoView: {
            try {
              contentWindow.document.body
                ?.querySelector(data.selector)
                ?.scrollIntoView(data.options);
            } catch (err) {}
            break;
          }

          default:
            break;
        }
      } else if (connection) {
        connection.pub(PUBSUB_TOPIC_PARENT_TO_CHILD, { type, data });
      }
    },
    [connection]
  );

  const scrollHandler = useCallback(
    debounce((event) => {
      if (connection) {
        const scrollTop = (event.target?.scrollTop || 0) - scrollContainerOffset;
        const offset = Math.max(0, scrollTop);
        operateIframe({
          type: IFRAME_VALID_MESSAGE_TYPE.updateAnchorOffset,
          data: { offset },
        });
      }
    }, 200),
    [scrollContainerOffset, operateIframe]
  );

  useEffect(() => {
    refScrollContainer.current = getContainer(scrollContainer);

    on(refScrollContainer.current, 'scroll', scrollHandler);

    return () => {
      off(refScrollContainer.current, 'scroll', scrollHandler);
    };
  }, [scrollContainer, scrollHandler]);

  useEffect(() => {
    if (iframeLoadTimes > 0 && extraStyle) {
      operateIframe({
        type: IFRAME_VALID_MESSAGE_TYPE.appendExtraStyle,
        data: { href: extraStyle },
      });
    }
  }, [iframeLoadTimes, extraStyle, operateIframe]);

  useEffect(() => {
    if (iframeLoadTimes > 0) {
      operateIframe({
        type: IFRAME_VALID_MESSAGE_TYPE.switchDarkMode,
        data: { dark: darkMode },
      });
    }
  }, [iframeLoadTimes, darkMode, operateIframe]);

  useImperativeHandle<any, OverviewHandle>(
    ref,
    () => {
      return {
        scrollIntoView: (selector: string, options: any) => {
          operateIframe({
            type: IFRAME_VALID_MESSAGE_TYPE.scrollIntoView,
            data: { selector, options },
          });
        },
        updateMDXPreviewActiveTab: (tab: string) => {
          operateIframe({
            type: IFRAME_VALID_MESSAGE_TYPE.switchActiveTab,
            data: { tab },
          });
        },
      };
    },
    [operateIframe]
  );

  return (
    <Spin block loading={isLoading} {...spinProps}>
      <div className={cs(styles.overview, { [styles.fullscreen]: iframeFullscreen })}>
        <div className={styles.operationButtons}>
          <div
            title="open in new tab"
            className={styles.button}
            onClick={() => window.open(src, '_blank')}
          >
            <IconShareInternal />
          </div>
          <div
            title="toggle fullscreen"
            className={styles.button}
            onClick={() => setIframeFullscreen(!iframeFullscreen)}
          >
            {iframeFullscreen ? <IconFullscreenExit /> : <IconFullscreen />}
          </div>
        </div>
        <iframe
          ref={(ref) => {
            refIframe.current = ref;
            if (iframe) {
              iframe.current = ref;
            }
          }}
          style={{
            ...style,
            opacity: isLoading ? 0.1 : 1,
            height: isLoading ? '80vh' : height,
          }}
          className={cs(className, styles.iframe)}
          title="material-component-overview"
          scrolling={iframeFullscreen ? 'auto' : 'no'}
          src={src}
          onLoad={(event) => {
            onIframeLoad?.(event);
            setIframeLoadTimes(iframeLoadTimes > 10e8 ? 1 : iframeLoadTimes + 1);

            clearTimeout(refLoadingTimer.current);
            refLoadingTimer.current = setTimeout(() => onTimeout?.(), timeout);
          }}
          onError={onIframeError}
        />
      </div>
    </Spin>
  );
});
