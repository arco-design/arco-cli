// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { MDXProviderComponents } from '@mdx-js/react';
import { Anchor } from './anchor';
import { Snippet } from './snippet';
import { DemoView } from './demoView';
import { DocAnchor } from './docAnchor';
import { Heading } from './heading';
import { Tabs } from './tabs';

export const COMPONENT_NAME_DEMO_VIEW = 'ArcoDemoView';

export const COMPONENT_NAME_DOC_ANCHOR = 'ArcoDocAnchor';

export const COMPONENT_NAME_TABS = 'ArcoMDXPreviewSplit';

export const DEFAULT_MDX_COMPONENTS: MDXProviderComponents = {
  a: Anchor,
  code: Snippet,
  h1: (props) => <Heading {...props} depth={1} />,
  h2: (props) => <Heading {...props} depth={2} />,
  h3: (props) => <Heading {...props} depth={3} />,
  h4: (props) => <Heading {...props} depth={4} />,
  h5: (props) => <Heading {...props} depth={5} />,
  h6: (props) => <Heading {...props} depth={6} />,
  [COMPONENT_NAME_DEMO_VIEW]: DemoView,
  [COMPONENT_NAME_DOC_ANCHOR]: DocAnchor,
  [COMPONENT_NAME_TABS]: Tabs,
};
