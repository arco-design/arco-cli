// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { DocsRootProps } from '@arco-cli/aspect/dist/docs/previewRuntime';

import { MDXLayout } from '../markdown';
import { Theme } from './theme';
import { Content as DocContent } from './doc/content';
import { PropertiesTable } from './doc/propertiesTable';

import '../style/colors.scss';
import './app.scss';

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
