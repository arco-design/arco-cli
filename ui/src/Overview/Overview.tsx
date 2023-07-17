import cs from 'classnames';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Spin } from '@arco-design/web-react';

import { OverviewProps, OverviewHandle } from './interface';
import { useIframeHeight } from '../utils/useIframeHeight';

export const Overview = forwardRef(function (props: OverviewProps, ref) {
  const { style, className, src, iframe, extraStyle, onIframeLoad, spinProps } = props;

  const refIframe = useRef<HTMLIFrameElement>(null);

  const [iframeLoadTimes, setIframeLoadTimes] = useState(0);

  const height = useIframeHeight(refIframe);
  const isReady = !height;

  const appendExtraStyle = (href: string) => {
    const contentWindow = refIframe.current?.contentWindow;
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

  useEffect(() => {
    if (iframeLoadTimes > 0 && extraStyle) {
      appendExtraStyle(extraStyle);
    }
  }, [iframeLoadTimes, extraStyle]);

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
    <Spin block {...spinProps}>
      <iframe
        ref={(ref) => {
          refIframe.current = ref;
          if (iframe) {
            iframe.current = ref;
          }
        }}
        style={{
          ...style,
          opacity: isReady ? 0 : 1,
          height: isReady ? '100vh' : height,
        }}
        className={cs(className)}
        title="material-component-overview"
        scrolling="no"
        src={src}
        onLoad={(event) => {
          onIframeLoad?.(event);
          setIframeLoadTimes(iframeLoadTimes > 10e8 ? 0 : iframeLoadTimes + 1);
        }}
      />
    </Spin>
  );
});
