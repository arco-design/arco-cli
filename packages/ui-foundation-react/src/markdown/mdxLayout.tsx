// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo, ReactNode } from 'react';
import { MDXProvider, MDXProviderComponents } from '@mdx-js/react';
import classNames from 'classnames';
import { DEFAULT_MDX_COMPONENTS } from './components';

import styles from './mdxLayout.module.scss';

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
      <div className={classNames(styles.mdxContent, className)} {...rest}>
        {children}
      </div>
    </MDXProvider>
  );
}
