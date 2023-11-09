/**
 * This is the entry for preview-runtime render
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom';
import type { DocsRootProps } from '@arco-cli/aspect/dist/docs/previewRuntime';

import { App } from './app';

const MOUNT_ROOT_SELECTOR = '#root';

export default function ({
  mountRoot = MOUNT_ROOT_SELECTOR,
  ...rest
}: DocsRootProps & { mountRoot: string | HTMLElement }) {
  ReactDOM.render(
    <App {...rest} />,
    typeof mountRoot === 'string' ? document.querySelector(mountRoot) : mountRoot
  );
}
