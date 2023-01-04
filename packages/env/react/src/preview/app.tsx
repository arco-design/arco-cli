// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { DocsRootProps } from '@arco-cli/docs/dist/preview';

import { Theme } from './theme';
import { Content as DocContent } from './doc/content';
import { PropertiesTable } from './doc/propertiesTable';

export function App({ docs, metadata }: DocsRootProps) {
  return (
    <Theme>
      <DocContent docs={docs} />
      <PropertiesTable schema={metadata} />
    </Theme>
  );
}
