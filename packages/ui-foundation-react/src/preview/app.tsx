// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { DocsRootProps } from '@arco-cli/aspect/dist/docs/previewRuntime';

import { MDXLayout } from '../markdown/mdxLayout';
import { Theme } from './theme';
import { Content as DocContent } from './doc/content';
import { PropertiesTable } from './doc/propertiesTable';
import { DocAnchorContextProvider } from '../markdown/components/docAnchor';
import { PreviewContextProvider } from './previewContext';

import '../style/colors.scss';
import './app.scss';

export function App({ doc, metadata }: DocsRootProps) {
  return (
    <PreviewContextProvider>
      <Theme>
        <DocAnchorContextProvider>
          <MDXLayout>
            <DocContent doc={doc} />
            <PropertiesTable doclet={metadata as any} />
          </MDXLayout>
        </DocAnchorContextProvider>
      </Theme>
    </PreviewContextProvider>
  );
}
