import React, { IframeHTMLAttributes, useRef } from 'react';
import { compact } from 'lodash';
import { usePubsubIframe } from '@arco-cli/aspect/dist/pubsub';
import { ComponentModel } from '@arco-cli/aspect/dist/component/uiRuntime';
import { useIframeHeight } from '@arco-cli/aspect/dist/pubsub/previewRuntime';

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
}

/**
 * renders a preview of a component.
 */
export function ComponentPreview({
  component,
  previewName,
  queryParams,
  pubsub,
  viewport = 1280,
  style,
  ...rest
}: ComponentPreviewProps) {
  const refIframe = useRef<HTMLIFrameElement>(null);
  const height = useIframeHeight(refIframe);

  usePubsubIframe(pubsub ? refIframe : undefined);

  const params = Array.isArray(queryParams)
    ? queryParams.concat(`viewport=${viewport}`)
    : compact([queryParams, `viewport=${viewport}`]);

  const targetParams = viewport === null ? queryParams : params;
  const url = toPreviewUrl(component, previewName, targetParams);
  const targetHeight = height !== 0 ? height : 2000;

  return (
    <div className={styles.preview}>
      <iframe
        {...rest}
        ref={refIframe}
        style={{
          ...style,
          height: targetHeight,
        }}
        title="preview-component"
        src={url}
      />
    </div>
  );
}
