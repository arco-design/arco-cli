// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo, ReactNode } from 'react';
import { MDXProvider, MDXProviderComponents } from '@mdx-js/react';
import classNames from 'classnames';
import { DEFAULT_MDX_COMPONENTS } from '../components';

// use markdown-limit.css, not markdown.css
import '../style/markdown-limit.css';
import styles from './mdxLayout.module.scss';

const MARKDOWN_BODY_CLASSNAME = 'markdown-body';

export type { MDXProviderComponents } from '@mdx-js/react';

export interface MDXLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  components?: MDXProviderComponents;
}

/** Arco flavored MDX theme */
export function MDXLayout({ children, components, className, ...rest }: MDXLayoutProps) {
  const _components = useMemo(() => {
    // add classname 'markdown-element' to these markdown elements
    // then we can apply css styles to them
    const tagNames: Array<keyof MDXProviderComponents> = [
      'a',
      'abbr',
      'b',
      'button',
      'code',
      'dfn',
      'em',
      'figure',
      'hr',
      'img',
      'input',
      'kbd',
      'li',
      'mark',
      'ol',
      'p',
      'samp',
      'small',
      'span',
      'strong',
      'sub',
      'summary',
      'sup',
      'table',
      'td',
      'th',
      'tr',
      'ul',
    ];
    const interExtendedComponents = {};

    tagNames.forEach((tag) => {
      if (typeof tag === 'string') {
        interExtendedComponents[tag] = (props) => {
          return React.createElement(tag, {
            ...props,
            className: classNames(props.className, 'a-md-element'),
          });
        };
      }
    });

    return {
      ...interExtendedComponents,
      ...DEFAULT_MDX_COMPONENTS,
      ...components,
    };
  }, [DEFAULT_MDX_COMPONENTS, components]);

  return (
    <MDXProvider components={_components}>
      <div className={classNames(MARKDOWN_BODY_CLASSNAME, styles.mdxContent, className)} {...rest}>
        {children}
      </div>
    </MDXProvider>
  );
}
