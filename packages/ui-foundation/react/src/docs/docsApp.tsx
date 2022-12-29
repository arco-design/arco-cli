// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { Docs } from '@arco-cli/docs';

import { DocsTheme } from './docsTheme';
import { DocsContent } from './docsContent';

import '../style/global.scss';

interface ReactDocsAppProps {
  docs?: Docs;
}

export function DocsApp({ docs }: ReactDocsAppProps) {
  return (
    <DocsTheme>
      <DocsContent docs={docs} />
    </DocsTheme>
  );
}
