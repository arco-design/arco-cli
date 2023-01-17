// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { DocsRootProps } from '@arco-cli/docs/dist/preview';
import { MDXLayout } from '@arco-cli/ui-foundation-react';

import { Theme } from './theme';
import { Content as DocContent } from './doc/content';
import { PropertiesTable } from './doc/propertiesTable';

import './app.scss';
import '@arco-cli/ui-foundation-react/dist/style/colors.scss';

export function App({ doc, metadata }: DocsRootProps) {
  return (
    <Theme>
      <MDXLayout>
        <DocContent doc={doc} />
        <PropertiesTable schema={metadata as any} />
      </MDXLayout>
    </Theme>
  );
}
