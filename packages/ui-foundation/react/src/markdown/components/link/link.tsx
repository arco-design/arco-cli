// eslint-disable-next-line import/no-extraneous-dependencies
import React, { AnchorHTMLAttributes } from 'react';
import cs from 'classnames';

import styles from './link.module.scss';

export function Link({
  href,
  children,
  className,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cs(styles.link, className)}
    >
      {children}
    </a>
  );
}
