import type { MDXProviderComponents } from '@mdx-js/react';
import { Link } from './link';
import { Snippet } from './snippet';
import { DemoView } from './demoView';

export const DEFAULT_MDX_COMPONENTS: MDXProviderComponents = {
  a: Link,
  code: Snippet,
  ArcoDemoView: DemoView,
};
