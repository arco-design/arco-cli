// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo, ReactNode } from 'react';
import { MDXProvider, MDXProviderComponents } from '@mdx-js/react';
import classNames from 'classnames';
import { DEFAULT_MDX_COMPONENTS } from '../components';

// import '../style/markdown.css';
import styles from './mdxLayout.module.scss';

const MARKDOWN_BODY_CLASSNAME = 'markdown-body';

export type { MDXProviderComponents } from '@mdx-js/react';

export interface MDXLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  components?: MDXProviderComponents;
}

/** Arco flavored MDX theme */
export function MDXLayout({ children, components, className, ...rest }: MDXLayoutProps) {
  const _components = useMemo(
    () => ({ ...DEFAULT_MDX_COMPONENTS, ...components }),
    [DEFAULT_MDX_COMPONENTS, components]
  );

  return (
    <MDXProvider components={_components}>
      <div className={classNames(MARKDOWN_BODY_CLASSNAME, styles.mdxContent, className)} {...rest}>
        {children}
      </div>
    </MDXProvider>
  );
}
