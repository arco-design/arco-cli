import React, { IframeHTMLAttributes, useRef, forwardRef, useImperativeHandle } from 'react';
import { compact } from 'lodash';
import { usePubsubIframe } from '@arco-cli/aspect/dist/pubsub';
import { ComponentModel } from '@arco-cli/aspect/dist/component/uiRuntime';
import { useIframeHeight } from '@arco-cli/aspect/dist/pubsub/previewRuntime';
import { Spin } from '@arco-cli/ui-foundation-react/dist/spin';

import { toPreviewUrl } from './urls';

import styles from './componentPreview.module.scss';

// omitting 'referrerPolicy' because of an TS error during build. Re-include when needed
export interface ComponentPreviewProps
  extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, 'src' | 'referrerPolicy'> {
  /**
   * component to preview.
   */
  component: ComponentModel;

  /**
   * preview name.
   */
  previewName?: string;

  /**
   * query params to append at the end of the *hash*. Changing this property will not reload the preview
   * e.g. 'foo=bar&bar=there', or ['foo=bar', 'bar=there']
   */
  queryParams?: string | string[];

  /**
   * establish a pubsub connection to the iframe,
   * allowing sending and receiving messages
   */
  pubsub?: boolean;

  /**
   * viewport
   */
  viewport?: number | null;

  /**
   * callback for iframe loaded
   */
  onIframeLoad?: (event) => void;
}

export type ComponentPreviewHandle = {
  appendExtraStyle: (href: string) => void;
};

/**
 * renders a preview of a component.
 */
export const ComponentPreview = forwardRef(function (
  {
    component,
    previewName,
    queryParams,
    pubsub,
    viewport = 1280,
    style,
    onIframeLoad,
    ...rest
  }: ComponentPreviewProps,
  ref
) {
  const refIframe = useRef<HTMLIFrameElement>(null);
  const height = useIframeHeight(refIframe);

  usePubsubIframe(pubsub ? refIframe : undefined);

  const params = Array.isArray(queryParams)
    ? queryParams.concat(`viewport=${viewport}`)
    : compact([queryParams, `viewport=${viewport}`]);

  const targetParams = viewport === null ? queryParams : params;
  const url = toPreviewUrl(component, previewName, targetParams);
  const isLoading = !height;

  useImperativeHandle<any, ComponentPreviewHandle>(
    ref,
    () => {
      return {
        appendExtraStyle: (href: string) => {
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
        },
      };
    },
    []
  );

  return (
    <Spin className={styles.preview} loading={isLoading} tip="preview loading...">
      <iframe
        {...rest}
        ref={refIframe}
        style={{
          ...style,
          opacity: isLoading ? 0 : 1,
          height: isLoading ? 'calc(100vh - 300px)' : height,
        }}
        title="preview-component"
        src={url}
        onLoad={onIframeLoad}
      />
    </Spin>
  );
});
