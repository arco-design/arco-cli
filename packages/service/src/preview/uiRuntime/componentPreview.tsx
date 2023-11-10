import React, { IframeHTMLAttributes, useContext } from 'react';
import { compact } from 'lodash';
import { ComponentModel } from '@arco-cli/aspect/dist/component/uiRuntime';
import { Overview } from '@arco-cli/workspace-materials';
import { WorkspaceContext } from '@arco-cli/ui-foundation-react';

import { toPreviewUrl } from './urls';

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
   * viewport
   */
  viewport?: number | null;

  /**
   * extra stylesheet apply to iframe
   */
  extraStyle?: string;

  /**
   * is in dark mode
   */
  darkMode?: boolean;
}

/**
 * renders a preview of a component.
 */
export const ComponentPreview = function ({
  component,
  previewName,
  queryParams,
  viewport = 1280,
  extraStyle,
  darkMode,
}: ComponentPreviewProps) {
  const { overviewScrollContainerID } = useContext(WorkspaceContext);

  const targetParams =
    viewport === null
      ? queryParams
      : Array.isArray(queryParams)
      ? queryParams.concat(`viewport=${viewport}`)
      : compact([queryParams, `viewport=${viewport}`]);
  const url = toPreviewUrl(component, previewName, targetParams);

  return (
    <Overview
      src={url}
      scrollContainer={`#${overviewScrollContainerID}`}
      extraStyle={extraStyle}
      darkMode={darkMode}
      spinProps={{ tip: 'Loading...' }}
      scrollContainerOffset={220}
    />
  );
};
