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
import { useIframeHeight } from '../utils/useIframeHeight';
import { findNode } from '../utils/findNode';
import { on, off } from '../utils/dom';
import { GLOBAL_METHOD_MAP_KEY } from '../utils/constant';

// @ts-ignore
import styles from './style/index.module.less';

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
    spinProps,
    onIframeLoad,
  } = props;

  const refIframe = useRef<HTMLIFrameElement>(null);
  const refScrollContainer = useRef<HTMLElement | Window>(null);

  const [iframeLoadTimes, setIframeLoadTimes] = useState(0);
  const [iframeFullscreen, setIframeFullscreen] = useState(false);

  const height = useIframeHeight(refIframe);
  const isLoading = !height;

  const getIframeWindow = (): Window | null => {
    return refIframe.current && canAccessIFrame(refIframe.current)
      ? refIframe.current.contentWindow
      : null;
  };

  const appendExtraStyle = (href: string) => {
    const contentWindow = getIframeWindow();
    if (contentWindow) {
      const eleClassName = '__arco-component-extra-style';

      // clear all append styles at first
      contentWindow.document
        .querySelectorAll(`.${eleClassName}`)
        .forEach((node) => contentWindow.document.body.removeChild(node));

      if (href) {
        const styleEle = document.createElement('link');
        styleEle.setAttribute('class', eleClassName);
        styleEle.setAttribute('type', 'text/css');
        styleEle.setAttribute('rel', 'stylesheet');
        styleEle.setAttribute('href', href);
        contentWindow.document.body?.prepend(styleEle);
      }
    }
  };

  const toggleDarkMode = (dark: boolean) => {
    const contentWindow = getIframeWindow();
    if (contentWindow) {
      const body = contentWindow.document.body;
      dark ? body.setAttribute('arco-theme', 'dark') : body.removeAttribute('arco-theme');
    }
  };

  const scrollHandler = useCallback(
    debounce((event) => {
      const contentWindow = getIframeWindow();
      if (contentWindow) {
        const updateAnchorOffset = contentWindow[GLOBAL_METHOD_MAP_KEY]?.updateAnchorOffset;
        if (typeof updateAnchorOffset === 'function') {
          try {
            const scrollTop = (event.target?.scrollTop || 0) - scrollContainerOffset;
            updateAnchorOffset(Math.max(0, scrollTop));
          } catch (err) {
            console.warn(`Failed to update anchor position in component preview page, details:
${err.toString()}`);
          }
        }
      }
    }, 200),
    [scrollContainerOffset]
  );

  useEffect(() => {
    refScrollContainer.current = getContainer(scrollContainer);

    on(refScrollContainer.current, 'scroll', scrollHandler);

    return () => {
      off(refScrollContainer.current, 'scroll', scrollHandler);
    };
  }, [scrollContainer]);

  useEffect(() => {
    if (iframeLoadTimes > 0 && extraStyle) {
      appendExtraStyle(extraStyle);
    }
  }, [iframeLoadTimes, extraStyle]);

  useEffect(() => {
    if (iframeLoadTimes > 0) {
      toggleDarkMode(darkMode);
    }
  }, [iframeLoadTimes, darkMode]);

  useImperativeHandle<any, OverviewHandle>(
    ref,
    () => {
      return {
        appendExtraStyle,
      };
    },
    []
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
          }}
        />
      </div>
    </Spin>
  );
});
